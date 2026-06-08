using InstagramScheduler.API.Data;
using InstagramScheduler.API.Models.Entities;
using InstagramScheduler.API.Options;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace InstagramScheduler.API.Services;

public class ThreadsPublisher : ISocialPublisher
{
    private readonly AppDbContext _db;
    private readonly MetaOptions _meta;
    private readonly HttpClient _http;
    private readonly ILogger<ThreadsPublisher> _logger;
    private readonly IDataProtector _protector;

    private string AppId => !string.IsNullOrEmpty(_meta.ThreadsAppId) ? _meta.ThreadsAppId : _meta.AppId;
    private string AppSecret => !string.IsNullOrEmpty(_meta.ThreadsAppSecret) ? _meta.ThreadsAppSecret : _meta.AppSecret;
    private string RedirectUri => !string.IsNullOrEmpty(_meta.ThreadsRedirectUri) ? _meta.ThreadsRedirectUri : _meta.RedirectUri;

    public SocialPlatform Platform => SocialPlatform.Threads;

    public ThreadsPublisher(
        AppDbContext db,
        IOptions<MetaOptions> meta,
        IHttpClientFactory httpFactory,
        ILogger<ThreadsPublisher> logger,
        IDataProtectionProvider dataProtection)
    {
        _db = db;
        _meta = meta.Value;
        _http = httpFactory.CreateClient();
        _logger = logger;
        _protector = dataProtection.CreateProtector("InstagramScheduler.AccessTokens");
    }

    public Task<string> GetAuthUrlAsync(int userId)
    {
        var redirectUri = Uri.EscapeDataString(RedirectUri);
        var scopes = "threads_basic,threads_content_publish";
        var state = $"{userId}:{(int)SocialPlatform.Threads}";
        return Task.FromResult(
            $"https://threads.net/oauth/authorize?client_id={AppId}&redirect_uri={redirectUri}&scope={scopes}&response_type=code&state={state}");
    }

    public async Task<List<SocialAccount>> HandleCallbackAsync(string code, string rawState)
    {
        var parts = rawState.Split(':');
        var userId = int.Parse(parts[0]);

        var tokenContent = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["client_id"] = AppId,
            ["client_secret"] = AppSecret,
            ["grant_type"] = "authorization_code",
            ["redirect_uri"] = RedirectUri,
            ["code"] = code
        });

        var tokenResponse = await _http.PostAsync("https://graph.threads.net/oauth/access_token", tokenContent);
        var tokenRaw = await tokenResponse.Content.ReadAsStringAsync();
        var tokenData = JsonSerializer.Deserialize<JsonElement>(tokenRaw);

        if (tokenData.TryGetProperty("error", out var tokenErr))
            throw new InvalidOperationException($"Error al obtener token de Threads: {tokenErr.GetProperty("message").GetString()}");

        var shortToken = tokenData.GetProperty("access_token").GetString()!;
        var longLivedToken = await ExchangeLongLivedTokenAsync(shortToken);

        var meRaw = await (await _http.GetAsync(
            $"https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url&access_token={longLivedToken}"))
            .Content.ReadAsStringAsync();
        var meData = JsonSerializer.Deserialize<JsonElement>(meRaw);

        var threadsId = meData.GetProperty("id").GetString()!;
        var username = meData.TryGetProperty("username", out var u) ? u.GetString() ?? "" : "";
        var name = meData.TryGetProperty("name", out var n) ? n.GetString() ?? "" : username;
        var picUrl = meData.TryGetProperty("threads_profile_picture_url", out var pic) ? pic.GetString() : null;

        var account = await UpsertAsync(userId, threadsId, username, name, picUrl, longLivedToken);
        await _db.SaveChangesAsync();
        return [account];
    }

    public async Task<SocialAccount> ConnectWithTokenAsync(string token, int userId)
    {
        var resp = await _http.GetAsync(
            $"https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url&access_token={token}");
        var raw = await resp.Content.ReadAsStringAsync();
        var data = JsonSerializer.Deserialize<JsonElement>(raw);

        if (data.TryGetProperty("error", out var err))
            throw new InvalidOperationException($"Token de Threads inválido: {err.GetProperty("message").GetString()}");

        var threadsId = data.GetProperty("id").GetString()!;
        var username = data.TryGetProperty("username", out var u) ? u.GetString() ?? "" : "";
        var name = data.TryGetProperty("name", out var n) ? n.GetString() ?? "" : username;
        var picUrl = data.TryGetProperty("threads_profile_picture_url", out var pic) ? pic.GetString() : null;

        var account = await UpsertAsync(userId, threadsId, username, name, picUrl, token);
        await _db.SaveChangesAsync();
        return account;
    }

    public async Task<PublishResult> PublishAsync(ScheduledPost post, SocialAccount account, CancellationToken ct = default)
    {
        var userId = account.PlatformUserId;
        var token = UnprotectToken(account.AccessToken);
        var text = post.Caption + (post.Hashtags != null ? $"\n\n{post.Hashtags}" : "");

        string containerId;

        if (post.MediaUrls.Count == 0)
        {
            containerId = await CreateContainerAsync(userId, token, "TEXT", null, text, ct);
        }
        else if (post.MediaUrls.Count == 1)
        {
            containerId = await CreateContainerAsync(userId, token, "IMAGE", post.MediaUrls[0], text, ct);
        }
        else
        {
            var childIds = new List<string>();
            foreach (var url in post.MediaUrls)
            {
                var childContent = new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["media_type"] = "IMAGE",
                    ["image_url"] = url,
                    ["is_carousel_item"] = "true",
                    ["access_token"] = token
                });
                var childResponse = await _http.PostAsync(
                    $"https://graph.threads.net/v1.0/{userId}/threads", childContent, ct);
                var childJson = JsonSerializer.Deserialize<JsonElement>(
                    await childResponse.Content.ReadAsStringAsync(ct));

                if (childJson.TryGetProperty("error", out var childErr))
                    return new PublishResult(false, null, childErr.GetProperty("message").GetString());

                childIds.Add(childJson.GetProperty("id").GetString()!);
            }

            var carouselContent = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["media_type"] = "CAROUSEL",
                ["children"] = string.Join(",", childIds),
                ["text"] = text,
                ["access_token"] = token
            });
            var carouselResponse = await _http.PostAsync(
                $"https://graph.threads.net/v1.0/{userId}/threads", carouselContent, ct);
            var carouselJson = JsonSerializer.Deserialize<JsonElement>(
                await carouselResponse.Content.ReadAsStringAsync(ct));

            if (carouselJson.TryGetProperty("error", out var carouselErr))
                return new PublishResult(false, null, carouselErr.GetProperty("message").GetString());

            containerId = carouselJson.GetProperty("id").GetString()!;
        }

        // Publicar el container
        var publishContent = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["creation_id"] = containerId,
            ["access_token"] = token
        });
        var publishResponse = await _http.PostAsync(
            $"https://graph.threads.net/v1.0/{userId}/threads_publish", publishContent, ct);
        var publishJson = JsonSerializer.Deserialize<JsonElement>(
            await publishResponse.Content.ReadAsStringAsync(ct));

        if (publishJson.TryGetProperty("error", out var publishErr))
            return new PublishResult(false, null, publishErr.GetProperty("message").GetString());

        return new PublishResult(true, publishJson.GetProperty("id").GetString(), null);
    }

    private async Task<string> CreateContainerAsync(string userId, string token, string mediaType, string? imageUrl, string text, CancellationToken ct)
    {
        var fields = new Dictionary<string, string>
        {
            ["media_type"] = mediaType,
            ["text"] = text,
            ["access_token"] = token
        };
        if (imageUrl != null) fields["image_url"] = imageUrl;

        var response = await _http.PostAsync(
            $"https://graph.threads.net/v1.0/{userId}/threads",
            new FormUrlEncodedContent(fields), ct);
        var json = JsonSerializer.Deserialize<JsonElement>(await response.Content.ReadAsStringAsync(ct));

        if (json.TryGetProperty("error", out var err))
            throw new InvalidOperationException(err.GetProperty("message").GetString());

        return json.GetProperty("id").GetString()!;
    }

    private async Task<string> ExchangeLongLivedTokenAsync(string shortToken)
    {
        try
        {
            var url = $"https://graph.threads.net/access_token" +
                      $"?grant_type=th_exchange_token" +
                      $"&client_secret={AppSecret}" +
                      $"&access_token={shortToken}";
            var raw = await _http.GetStringAsync(url);
            var response = JsonSerializer.Deserialize<JsonElement>(raw);

            if (response.TryGetProperty("error", out var err))
            {
                _logger.LogWarning("No se pudo intercambiar Threads token: {Err}. Usando token original.", err.GetProperty("message").GetString());
                return shortToken;
            }

            return response.GetProperty("access_token").GetString()!;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Exchange Threads token falló. Usando token original.");
            return shortToken;
        }
    }

    private async Task<SocialAccount> UpsertAsync(int userId, string threadsId, string username, string name, string? pic, string token)
    {
        var encryptedToken = _protector.Protect(token);
        var existing = await _db.SocialAccounts.FirstOrDefaultAsync(a =>
            a.PlatformUserId == threadsId && a.UserId == userId && a.Platform == SocialPlatform.Threads);

        if (existing != null)
        {
            existing.AccessToken = encryptedToken;
            existing.TokenExpiresAt = DateTime.UtcNow.AddDays(60);
            existing.Username = username;
            existing.Name = name;
            existing.ProfilePictureUrl = pic;
            existing.IsActive = true;
            return existing;
        }

        var account = new SocialAccount
        {
            UserId = userId,
            Platform = SocialPlatform.Threads,
            PlatformUserId = threadsId,
            Username = username,
            Name = name,
            ProfilePictureUrl = pic,
            AccessToken = encryptedToken,
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
            _logger.LogError(ex, "No se pudo descifrar el access token de Threads.");
            throw new InvalidOperationException("El token de acceso no puede descifrarse. Reconecta la cuenta desde Cuentas Sociales.");
        }
    }
}
