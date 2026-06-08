using InstagramScheduler.API.Data;
using InstagramScheduler.API.DTOs;
using InstagramScheduler.API.Models.Entities;
using InstagramScheduler.API.Options;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace InstagramScheduler.API.Services;

public class LinkedInPublisher : ISocialPublisher
{
    private readonly AppDbContext _db;
    private readonly LinkedInOptions _opts;
    private readonly HttpClient _http;
    private readonly ILogger<LinkedInPublisher> _logger;
    private readonly IDataProtector _protector;

    private const string ApiBase = "https://api.linkedin.com";
    private const string LinkedInVersion = "202401";

    public SocialPlatform Platform => SocialPlatform.LinkedIn;

    public LinkedInPublisher(
        AppDbContext db,
        IOptions<LinkedInOptions> opts,
        IHttpClientFactory httpFactory,
        ILogger<LinkedInPublisher> logger,
        IDataProtectionProvider dp)
    {
        _db = db;
        _opts = opts.Value;
        _http = httpFactory.CreateClient();
        _logger = logger;
        _protector = dp.CreateProtector("InstagramScheduler.AccessTokens");
    }

    public Task<string> GetAuthUrlAsync(int userId)
    {
        var redirectUri = Uri.EscapeDataString(_opts.RedirectUri);
        var scopes = Uri.EscapeDataString("openid profile email w_member_social");
        var state = $"{userId}:{(int)SocialPlatform.LinkedIn}";
        return Task.FromResult(
            $"https://www.linkedin.com/oauth/v2/authorization" +
            $"?response_type=code&client_id={_opts.ClientId}" +
            $"&redirect_uri={redirectUri}&scope={scopes}&state={state}");
    }

    public async Task<List<SocialAccount>> HandleCallbackAsync(string code, string rawState)
    {
        var parts = rawState.Split(':');
        var userId = int.Parse(parts[0]);

        _logger.LogInformation("LinkedIn callback: exchanging code for token (userId={UserId})", userId);
        var token = await ExchangeCodeAsync(code);
        _logger.LogInformation("LinkedIn token obtained, fetching profile...");
        var (personId, username, name, pictureUrl) = await GetProfileAsync(token);
        _logger.LogInformation("LinkedIn profile: id={Id} username={Username}", personId, username);

        var account = await UpsertAsync(userId, personId, username, name, pictureUrl, token);
        await _db.SaveChangesAsync();
        return [account];
    }

    public async Task<SocialAccount> ConnectWithTokenAsync(string token, int userId)
    {
        var (personId, username, name, pictureUrl) = await GetProfileAsync(token);
        var account = await UpsertAsync(userId, personId, username, name, pictureUrl, token);
        await _db.SaveChangesAsync();
        return account;
    }

    public async Task<List<LinkedInAccountOption>> GetOrganizationsForAccountAsync(SocialAccount account)
    {
        try { return await GetOrganizationsAsync(UnprotectToken(account.AccessToken)); }
        catch { return []; }
    }

    public async Task<List<LinkedInAccountOption>> GetOrganizationsAsync(string token)
    {
        var req = new HttpRequestMessage(HttpMethod.Get,
            $"{ApiBase}/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        req.Headers.Add("LinkedIn-Version", LinkedInVersion);
        req.Headers.Add("X-Restli-Protocol-Version", "2.0.0");

        var resp = await _http.SendAsync(req);
        if (!resp.IsSuccessStatusCode) return [];

        var json = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        if (!json.RootElement.TryGetProperty("elements", out var elements)) return [];

        var orgs = new List<DTOs.LinkedInAccountOption>();
        foreach (var el in elements.EnumerateArray())
        {
            if (!el.TryGetProperty("organization", out var orgProp)) continue;
            var orgUrn = orgProp.GetString() ?? "";
            var orgId = orgUrn.Split(':').LastOrDefault() ?? "";
            if (string.IsNullOrEmpty(orgId)) continue;

            var orgReq = new HttpRequestMessage(HttpMethod.Get,
                $"{ApiBase}/v2/organizations/{orgId}?fields=id,name,logoV2(original~:playableStreams)");
            orgReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            orgReq.Headers.Add("LinkedIn-Version", LinkedInVersion);
            orgReq.Headers.Add("X-Restli-Protocol-Version", "2.0.0");

            var orgResp = await _http.SendAsync(orgReq);
            if (!orgResp.IsSuccessStatusCode) continue;

            var orgJson = JsonDocument.Parse(await orgResp.Content.ReadAsStringAsync());
            var name = "";
            if (orgJson.RootElement.TryGetProperty("name", out var nameProp) &&
                nameProp.TryGetProperty("localized", out var localized))
            {
                name = localized.EnumerateObject().FirstOrDefault().Value.GetString() ?? orgId;
            }

            string? logoUrl = null;
            try
            {
                if (orgJson.RootElement.TryGetProperty("logoV2", out var logo) &&
                    logo.TryGetProperty("original~", out var orig) &&
                    orig.TryGetProperty("elements", out var logoEls))
                {
                    logoUrl = logoEls.EnumerateArray().FirstOrDefault()
                        .TryGetProperty("identifiers", out var ids)
                        ? ids.EnumerateArray().FirstOrDefault()
                            .TryGetProperty("identifier", out var idProp) ? idProp.GetString() : null
                        : null;
                }
            }
            catch { /* logo is optional */ }

            orgs.Add(new DTOs.LinkedInAccountOption($"org:{orgId}", name, logoUrl, "organization"));
        }
        return orgs;
    }

    public async Task<SocialAccount> ConnectOrgAsync(int userId, int personalAccountId, string orgId, string orgName, string? pictureUrl)
    {
        var personal = await _db.SocialAccounts.FirstOrDefaultAsync(a => a.Id == personalAccountId && a.UserId == userId)
            ?? throw new KeyNotFoundException("Cuenta personal de LinkedIn no encontrada.");

        var account = await UpsertAsync(userId, $"org:{orgId}", orgName.ToLower().Replace(" ", "-"), orgName, pictureUrl,
            _protector.Unprotect(personal.AccessToken));
        await _db.SaveChangesAsync();
        return account;
    }

    public async Task<PublishResult> PublishAsync(ScheduledPost post, SocialAccount account, CancellationToken ct = default)
    {
        var token = UnprotectToken(account.AccessToken);
        var isOrg = account.PlatformUserId.StartsWith("org:");
        var entityId = isOrg ? account.PlatformUserId[4..] : account.PlatformUserId;
        var authorUrn = isOrg ? $"urn:li:organization:{entityId}" : $"urn:li:person:{entityId}";
        var text = post.Caption + (post.Hashtags != null ? $"\n\n{post.Hashtags}" : "");

        var postBody = BuildPostBody(authorUrn, text);

        if (post.MediaUrls.Count == 1)
        {
            var imageUrn = await UploadImageAsync(token, authorUrn, post.MediaUrls[0], ct);
            if (imageUrn != null)
                postBody["content"] = new { media = new { id = imageUrn } };
        }
        else if (post.MediaUrls.Count > 1)
        {
            var imageUrns = new List<string>();
            foreach (var url in post.MediaUrls)
            {
                var urn = await UploadImageAsync(token, authorUrn, url, ct);
                if (urn != null) imageUrns.Add(urn);
            }
            if (imageUrns.Count > 0)
            {
                postBody["content"] = new
                {
                    multiImage = new
                    {
                        images = imageUrns.Select(u => new { id = u, altText = "" }).ToArray()
                    }
                };
            }
        }

        var json = JsonSerializer.Serialize(postBody);
        var req = new HttpRequestMessage(HttpMethod.Post, $"{ApiBase}/rest/posts");
        AddLinkedInHeaders(req, token);
        req.Content = new StringContent(json, Encoding.UTF8, "application/json");

        var resp = await _http.SendAsync(req, ct);
        if (!resp.IsSuccessStatusCode)
        {
            var err = await resp.Content.ReadAsStringAsync(ct);
            _logger.LogError("LinkedIn publish error: {Err}", err);
            return new PublishResult(false, null, $"Error LinkedIn: {resp.StatusCode}");
        }

        // LinkedIn returns post URN in X-RestLi-Id header
        resp.Headers.TryGetValues("X-RestLi-Id", out var headerVals);
        var postId = headerVals?.FirstOrDefault() ?? "unknown";
        return new PublishResult(true, postId, null);
    }

    private async Task<string> ExchangeCodeAsync(string code)
    {
        var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "authorization_code",
            ["code"] = code,
            ["redirect_uri"] = _opts.RedirectUri,
            ["client_id"] = _opts.ClientId,
            ["client_secret"] = _opts.ClientSecret,
        });

        var resp = await _http.PostAsync("https://www.linkedin.com/oauth/v2/accessToken", content);
        var raw = await resp.Content.ReadAsStringAsync();
        var data = JsonSerializer.Deserialize<JsonElement>(raw);

        if (data.TryGetProperty("error", out var err))
            throw new InvalidOperationException($"LinkedIn OAuth error: {err.GetString()}");

        return data.GetProperty("access_token").GetString()!;
    }

    private async Task<(string personId, string username, string name, string? pictureUrl)> GetProfileAsync(string token)
    {
        var req = new HttpRequestMessage(HttpMethod.Get, $"{ApiBase}/v2/userinfo");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var resp = await _http.SendAsync(req);
        var raw = await resp.Content.ReadAsStringAsync();
        var data = JsonSerializer.Deserialize<JsonElement>(raw);

        if (data.TryGetProperty("error", out var err))
            throw new InvalidOperationException($"Error al obtener perfil de LinkedIn: {err.GetString()}");

        var personId = data.GetProperty("sub").GetString()!;
        var name = data.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";
        var givenName = data.TryGetProperty("given_name", out var gn) ? gn.GetString() ?? "" : "";
        var familyName = data.TryGetProperty("family_name", out var fn) ? fn.GetString() ?? "" : "";
        var email = data.TryGetProperty("email", out var em) ? em.GetString() ?? "" : "";
        var picture = data.TryGetProperty("picture", out var pic) ? pic.GetString() : null;

        // LinkedIn doesn't have @username — use email prefix or full name slug
        var username = !string.IsNullOrEmpty(email)
            ? email.Split('@')[0]
            : (givenName + familyName).ToLower().Replace(" ", "");

        var displayName = !string.IsNullOrEmpty(name) ? name : $"{givenName} {familyName}".Trim();

        return (personId, username, displayName, picture);
    }

    private async Task<string?> UploadImageAsync(string token, string ownerUrn, string imageUrl, CancellationToken ct)
    {
        try
        {
            // Initialize upload
            var initReq = new HttpRequestMessage(HttpMethod.Post, $"{ApiBase}/rest/images?action=initializeUpload");
            AddLinkedInHeaders(initReq, token);
            initReq.Content = new StringContent(
                JsonSerializer.Serialize(new { initializeUploadRequest = new { owner = ownerUrn } }),
                Encoding.UTF8, "application/json");

            var initResp = await _http.SendAsync(initReq, ct);
            if (!initResp.IsSuccessStatusCode) return null;

            var initJson = JsonDocument.Parse(await initResp.Content.ReadAsStringAsync(ct));
            var uploadUrl = initJson.RootElement.GetProperty("value").GetProperty("uploadUrl").GetString()!;
            var imageUrn = initJson.RootElement.GetProperty("value").GetProperty("image").GetString()!;

            // Download image from blob
            var imageBytes = await _http.GetByteArrayAsync(imageUrl, ct);

            // Upload to LinkedIn
            var uploadReq = new HttpRequestMessage(HttpMethod.Put, uploadUrl);
            uploadReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            uploadReq.Content = new ByteArrayContent(imageBytes);
            uploadReq.Content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");

            var uploadResp = await _http.SendAsync(uploadReq, ct);
            if (!uploadResp.IsSuccessStatusCode) return null;

            return imageUrn;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "LinkedIn image upload failed for {Url}", imageUrl);
            return null;
        }
    }

    private static Dictionary<string, object> BuildPostBody(string authorUrn, string text) =>
        new()
        {
            ["author"] = authorUrn,
            ["commentary"] = text,
            ["visibility"] = "PUBLIC",
            ["distribution"] = new
            {
                feedDistribution = "MAIN_FEED",
                targetEntities = Array.Empty<object>(),
                thirdPartyDistributionChannels = Array.Empty<object>()
            },
            ["lifecycleState"] = "PUBLISHED",
            ["isReshareDisabledByAuthor"] = false
        };

    private static void AddLinkedInHeaders(HttpRequestMessage req, string token)
    {
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        req.Headers.Add("LinkedIn-Version", LinkedInVersion);
        req.Headers.Add("X-Restli-Protocol-Version", "2.0.0");
    }

    private async Task<SocialAccount> UpsertAsync(int userId, string personId, string username, string name, string? picture, string token)
    {
        var encrypted = _protector.Protect(token);
        var existing = await _db.SocialAccounts.FirstOrDefaultAsync(a =>
            a.PlatformUserId == personId && a.UserId == userId && a.Platform == SocialPlatform.LinkedIn);

        if (existing != null)
        {
            existing.AccessToken = encrypted;
            existing.TokenExpiresAt = DateTime.UtcNow.AddDays(60);
            existing.Username = username;
            existing.Name = name;
            existing.ProfilePictureUrl = picture;
            existing.IsActive = true;
            return existing;
        }

        var account = new SocialAccount
        {
            UserId = userId,
            Platform = SocialPlatform.LinkedIn,
            PlatformUserId = personId,
            Username = username,
            Name = name,
            ProfilePictureUrl = picture,
            AccessToken = encrypted,
            TokenExpiresAt = DateTime.UtcNow.AddDays(60)
        };
        _db.SocialAccounts.Add(account);
        return account;
    }

    private string UnprotectToken(string value)
    {
        try { return _protector.Unprotect(value); }
        catch (Exception ex)
        {
            _logger.LogError(ex, "No se pudo descifrar el access token de LinkedIn.");
            throw new InvalidOperationException("El token de acceso no puede descifrarse. Reconecta la cuenta.");
        }
    }
}
