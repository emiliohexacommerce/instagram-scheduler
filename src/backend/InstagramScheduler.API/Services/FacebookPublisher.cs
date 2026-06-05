using InstagramScheduler.API.Data;
using InstagramScheduler.API.Models.Entities;
using InstagramScheduler.API.Options;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace InstagramScheduler.API.Services;

public class FacebookPublisher : ISocialPublisher
{
    private readonly AppDbContext _db;
    private readonly MetaOptions _meta;
    private readonly HttpClient _http;
    private readonly ILogger<FacebookPublisher> _logger;
    private readonly IDataProtector _protector;

    public SocialPlatform Platform => SocialPlatform.Facebook;

    public FacebookPublisher(
        AppDbContext db,
        IOptions<MetaOptions> meta,
        IHttpClientFactory httpFactory,
        ILogger<FacebookPublisher> logger,
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
        var redirectUri = Uri.EscapeDataString(_meta.RedirectUri);
        var scopes = "pages_manage_posts,pages_read_engagement,pages_show_list";
        var state = $"{userId}:{(int)SocialPlatform.Facebook}";
        return Task.FromResult(
            $"https://www.facebook.com/v18.0/dialog/oauth?client_id={_meta.AppId}&redirect_uri={redirectUri}&scope={scopes}&state={state}");
    }

    public async Task<List<SocialAccount>> HandleCallbackAsync(string code, string rawState)
    {
        var parts = rawState.Split(':');
        var userId = int.Parse(parts[0]);

        var tokenUrl = $"https://graph.facebook.com/v18.0/oauth/access_token" +
            $"?client_id={_meta.AppId}&redirect_uri={_meta.RedirectUri}" +
            $"&client_secret={_meta.AppSecret}&code={code}";

        var tokenResponse = await _http.GetStringAsync(tokenUrl);
        var tokenData = JsonSerializer.Deserialize<JsonElement>(tokenResponse);
        var accessToken = tokenData.GetProperty("access_token").GetString()!;

        var accountsData = JsonSerializer.Deserialize<JsonElement>(
            await _http.GetStringAsync($"https://graph.facebook.com/v18.0/me/accounts?fields=id,name,picture&access_token={accessToken}"));

        var result = new List<SocialAccount>();

        foreach (var page in accountsData.GetProperty("data").EnumerateArray())
        {
            var pageId = page.GetProperty("id").GetString()!;
            var pageName = page.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";
            var pageToken = page.GetProperty("access_token").GetString()!;
            string? picUrl = null;

            if (page.TryGetProperty("picture", out var pic) &&
                pic.TryGetProperty("data", out var picData) &&
                picData.TryGetProperty("url", out var picUrlEl))
            {
                picUrl = picUrlEl.GetString();
            }

            var account = await UpsertAsync(userId, pageId, pageId, pageName, picUrl, pageToken);
            result.Add(account);
        }

        await _db.SaveChangesAsync();
        return result;
    }

    public async Task<PublishResult> PublishAsync(ScheduledPost post, SocialAccount account, CancellationToken ct = default)
    {
        var pageId = account.PlatformUserId;
        var token = UnprotectToken(account.AccessToken);
        var caption = post.Caption + (post.Hashtags != null ? $"\n\n{post.Hashtags}" : "");

        if (post.MediaUrls.Count == 0)
        {
            var textContent = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["message"] = caption,
                ["access_token"] = token
            });
            var textResponse = await _http.PostAsync($"https://graph.facebook.com/v18.0/{pageId}/feed", textContent, ct);
            var textJson = JsonSerializer.Deserialize<JsonElement>(await textResponse.Content.ReadAsStringAsync(ct));

            if (textJson.TryGetProperty("error", out var textErr))
                return new PublishResult(false, null, textErr.GetProperty("message").GetString());

            return new PublishResult(true, textJson.GetProperty("id").GetString(), null);
        }

        if (post.MediaUrls.Count == 1)
        {
            var content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["url"] = post.MediaUrls[0],
                ["caption"] = caption,
                ["access_token"] = token
            });
            var response = await _http.PostAsync($"https://graph.facebook.com/v18.0/{pageId}/photos", content, ct);
            var json = JsonSerializer.Deserialize<JsonElement>(await response.Content.ReadAsStringAsync(ct));

            if (json.TryGetProperty("error", out var err))
                return new PublishResult(false, null, err.GetProperty("message").GetString());

            return new PublishResult(true, json.GetProperty("id").GetString(), null);
        }

        // Multi-photo post
        var photoIds = new List<string>();
        foreach (var url in post.MediaUrls)
        {
            var photoContent = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["url"] = url,
                ["published"] = "false",
                ["access_token"] = token
            });
            var photoResponse = await _http.PostAsync($"https://graph.facebook.com/v18.0/{pageId}/photos", photoContent, ct);
            var photoJson = JsonSerializer.Deserialize<JsonElement>(await photoResponse.Content.ReadAsStringAsync(ct));

            if (photoJson.TryGetProperty("error", out var photoErr))
                return new PublishResult(false, null, photoErr.GetProperty("message").GetString());

            photoIds.Add(photoJson.GetProperty("id").GetString()!);
        }

        var attachedMedia = string.Join("&", photoIds.Select(id => $"attached_media[]={{\"media_fbid\":\"{id}\"}}"));
        var feedUrl = $"https://graph.facebook.com/v18.0/{pageId}/feed";
        var feedContent = new StringContent(
            $"message={Uri.EscapeDataString(caption)}&{attachedMedia}&access_token={token}",
            System.Text.Encoding.UTF8, "application/x-www-form-urlencoded");

        var feedResponse = await _http.PostAsync(feedUrl, feedContent, ct);
        var feedJson = JsonSerializer.Deserialize<JsonElement>(await feedResponse.Content.ReadAsStringAsync(ct));

        if (feedJson.TryGetProperty("error", out var feedErr))
            return new PublishResult(false, null, feedErr.GetProperty("message").GetString());

        return new PublishResult(true, feedJson.GetProperty("id").GetString(), null);
    }

    public async Task<List<DTOs.FacebookPageOption>> GetAvailablePagesAsync(string accessToken)
    {
        var longLivedToken = await ExchangeFacebookLongLivedTokenAsync(accessToken);

        var pagesRaw = await (await _http.GetAsync(
            $"https://graph.facebook.com/v18.0/me/accounts?fields=id,name,picture,access_token&access_token={longLivedToken}"))
            .Content.ReadAsStringAsync();
        var pagesData = JsonSerializer.Deserialize<JsonElement>(pagesRaw);

        if (pagesData.TryGetProperty("error", out var err))
            throw new InvalidOperationException($"Token inválido o sin permisos: {err.GetProperty("message").GetString()}");

        var result = new List<DTOs.FacebookPageOption>();
        foreach (var page in pagesData.GetProperty("data").EnumerateArray())
        {
            var pageId = page.GetProperty("id").GetString()!;
            var pageName = page.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";
            var pageToken = page.TryGetProperty("access_token", out var pt) ? pt.GetString()! : longLivedToken;

            string? picUrl = null;
            if (page.TryGetProperty("picture", out var pic) &&
                pic.TryGetProperty("data", out var picData) &&
                picData.TryGetProperty("url", out var picUrlEl))
            {
                picUrl = picUrlEl.GetString();
            }

            result.Add(new DTOs.FacebookPageOption(pageId, pageName, picUrl, pageToken));
        }

        // Si no hay páginas via /me/accounts, intentar como Page Access Token directo.
        // Solo válido si /me devuelve 'category' (indica que es una página, no un perfil personal).
        if (result.Count == 0)
        {
            var meRaw = await (await _http.GetAsync(
                $"https://graph.facebook.com/v18.0/me?fields=id,name,picture,category&access_token={longLivedToken}"))
                .Content.ReadAsStringAsync();
            var meData = JsonSerializer.Deserialize<JsonElement>(meRaw);

            if (!meData.TryGetProperty("error", out _) && meData.TryGetProperty("category", out _))
            {
                var pageId = meData.GetProperty("id").GetString()!;
                var pageName = meData.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";
                string? picUrl = null;
                if (meData.TryGetProperty("picture", out var picObj) &&
                    picObj.TryGetProperty("data", out var picData) &&
                    picData.TryGetProperty("url", out var picUrlEl))
                {
                    picUrl = picUrlEl.GetString();
                }
                result.Add(new DTOs.FacebookPageOption(pageId, pageName, picUrl, longLivedToken));
            }
        }

        if (result.Count == 0)
            throw new InvalidOperationException(
                "No se encontraron páginas de Facebook para este token. Asegúrate de generar un token nuevo con los permisos 'pages_show_list' y 'pages_manage_posts' desde el Graph API Explorer.");

        return result;
    }

    public async Task<SocialAccount> ConnectWithTokenAsync(string accessToken, int userId)
    {
        var longLivedToken = await ExchangeFacebookLongLivedTokenAsync(accessToken);

        // Intento 1: User Access Token — buscar páginas asociadas via /me/accounts
        var pagesRaw = await (await _http.GetAsync(
            $"https://graph.facebook.com/v18.0/me/accounts?fields=id,name,picture,access_token&access_token={longLivedToken}"))
            .Content.ReadAsStringAsync();
        var pagesData = JsonSerializer.Deserialize<JsonElement>(pagesRaw);

        if (!pagesData.TryGetProperty("error", out _))
        {
            var pages = pagesData.GetProperty("data").EnumerateArray().ToList();
            if (pages.Count > 0)
            {
                var page = pages[0];
                var pageId = page.GetProperty("id").GetString()!;
                var pageName = page.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";
                var pageToken = page.TryGetProperty("access_token", out var pt) ? pt.GetString()! : longLivedToken;

                string? picUrl = null;
                if (page.TryGetProperty("picture", out var pic) &&
                    pic.TryGetProperty("data", out var picData) &&
                    picData.TryGetProperty("url", out var picUrlEl))
                {
                    picUrl = picUrlEl.GetString();
                }

                var account = await UpsertAsync(userId, pageId, pageId, pageName, picUrl, pageToken);
                await _db.SaveChangesAsync();
                return account;
            }
        }

        // Intento 2: Page Access Token directo — solo válido si /me devuelve 'category' (es una página, no perfil personal)
        var meRaw = await (await _http.GetAsync(
            $"https://graph.facebook.com/v18.0/me?fields=id,name,picture,category&access_token={longLivedToken}"))
            .Content.ReadAsStringAsync();
        var meData = JsonSerializer.Deserialize<JsonElement>(meRaw);

        if (!meData.TryGetProperty("error", out _) && meData.TryGetProperty("category", out _))
        {
            var pageId = meData.GetProperty("id").GetString()!;
            var pageName = meData.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";

            string? picUrl = null;
            if (meData.TryGetProperty("picture", out var pic) &&
                pic.TryGetProperty("data", out var picData) &&
                picData.TryGetProperty("url", out var picUrlEl))
            {
                picUrl = picUrlEl.GetString();
            }

            var account = await UpsertAsync(userId, pageId, pageId, pageName, picUrl, longLivedToken);
            await _db.SaveChangesAsync();
            return account;
        }

        throw new InvalidOperationException(
            "No se pudo conectar la cuenta de Facebook. Verifica que el token tenga los permisos 'pages_show_list' y 'pages_manage_posts', y que gestiones al menos una página de Facebook.");
    }

    private async Task<string> ExchangeFacebookLongLivedTokenAsync(string shortToken)
    {
        try
        {
            var url = $"https://graph.facebook.com/v18.0/oauth/access_token" +
                      $"?grant_type=fb_exchange_token" +
                      $"&client_id={_meta.AppId}" +
                      $"&client_secret={_meta.AppSecret}" +
                      $"&fb_exchange_token={shortToken}";

            var raw = await _http.GetStringAsync(url);
            var response = JsonSerializer.Deserialize<JsonElement>(raw);

            if (response.TryGetProperty("error", out var err))
            {
                _logger.LogWarning("No se pudo intercambiar FB token: {Err}. Usando token original.", err.GetProperty("message").GetString());
                return shortToken;
            }

            return response.GetProperty("access_token").GetString()!;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Exchange FB token falló. Usando token original.");
            return shortToken;
        }
    }

    private async Task<SocialAccount> UpsertAsync(int userId, string pageId, string username, string name, string? pic, string token)
    {
        var encryptedToken = _protector.Protect(token);
        var existing = await _db.SocialAccounts.FirstOrDefaultAsync(a =>
            a.PlatformUserId == pageId && a.UserId == userId && a.Platform == SocialPlatform.Facebook);

        if (existing != null)
        {
            existing.AccessToken = encryptedToken;
            existing.TokenExpiresAt = DateTime.UtcNow.AddDays(60);
            existing.Name = name;
            existing.ProfilePictureUrl = pic;
            existing.IsActive = true;
            return existing;
        }

        var account = new SocialAccount
        {
            UserId = userId,
            Platform = SocialPlatform.Facebook,
            PlatformUserId = pageId,
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
            _logger.LogError(ex, "No se pudo descifrar el access token — reconecta la cuenta.");
            throw new InvalidOperationException("El token de acceso no puede descifrarse. Reconecta la cuenta desde Cuentas Sociales.");
        }
    }
}
