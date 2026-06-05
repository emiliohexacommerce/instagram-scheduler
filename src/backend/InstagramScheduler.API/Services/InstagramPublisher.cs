using InstagramScheduler.API.Data;
using InstagramScheduler.API.Models.Entities;
using InstagramScheduler.API.Options;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace InstagramScheduler.API.Services;

public class InstagramPublisher : ISocialPublisher
{
    private readonly AppDbContext _db;
    private readonly MetaOptions _meta;
    private readonly HttpClient _http;
    private readonly ILogger<InstagramPublisher> _logger;
    private readonly IDataProtector _protector;

    public SocialPlatform Platform => SocialPlatform.Instagram;

    public InstagramPublisher(
        AppDbContext db,
        IOptions<MetaOptions> meta,
        IHttpClientFactory httpFactory,
        ILogger<InstagramPublisher> logger,
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
        var scopes = "instagram_basic,instagram_content_publish,pages_read_engagement,pages_show_list";
        var state = $"{userId}:{(int)SocialPlatform.Instagram}";
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
            await _http.GetStringAsync($"https://graph.facebook.com/v18.0/me/accounts?access_token={accessToken}"));

        var result = new List<SocialAccount>();

        foreach (var page in accountsData.GetProperty("data").EnumerateArray())
        {
            var pageId = page.GetProperty("id").GetString()!;
            var pageToken = page.GetProperty("access_token").GetString()!;

            var igData = JsonSerializer.Deserialize<JsonElement>(
                await _http.GetStringAsync($"https://graph.facebook.com/v18.0/{pageId}?fields=instagram_business_account&access_token={pageToken}"));

            if (!igData.TryGetProperty("instagram_business_account", out var igAccount)) continue;

            var igId = igAccount.GetProperty("id").GetString()!;
            var igInfo = JsonSerializer.Deserialize<JsonElement>(
                await _http.GetStringAsync($"https://graph.facebook.com/v18.0/{igId}?fields=username,name,profile_picture_url&access_token={pageToken}"));

            var account = await UpsertAsync(userId, igId,
                igInfo.TryGetProperty("username", out var u) ? u.GetString() ?? "" : "",
                igInfo.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "",
                igInfo.TryGetProperty("profile_picture_url", out var pic) ? pic.GetString() : null,
                pageToken);

            result.Add(account);
        }

        await _db.SaveChangesAsync();
        return result;
    }

    public async Task<PublishResult> PublishAsync(ScheduledPost post, SocialAccount account, CancellationToken ct = default)
    {
        var igId = account.PlatformUserId;
        var token = UnprotectToken(account.AccessToken);
        var caption = post.Caption + (post.Hashtags != null ? $"\n\n{post.Hashtags}" : "");

        string mediaContainerId;

        if (post.MediaUrls.Count == 1)
        {
            var content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["image_url"] = post.MediaUrls[0],
                ["caption"] = caption,
                ["access_token"] = token
            });
            var response = await _http.PostAsync($"https://graph.instagram.com/v21.0/{igId}/media", content, ct);
            var json = JsonSerializer.Deserialize<JsonElement>(await response.Content.ReadAsStringAsync(ct));

            if (json.TryGetProperty("error", out var err))
                return new PublishResult(false, null, err.GetProperty("message").GetString());

            mediaContainerId = json.GetProperty("id").GetString()!;
        }
        else
        {
            var childIds = new List<string>();
            foreach (var url in post.MediaUrls)
            {
                var childContent = new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["image_url"] = url,
                    ["is_carousel_item"] = "true",
                    ["access_token"] = token
                });
                var childResponse = await _http.PostAsync($"https://graph.instagram.com/v21.0/{igId}/media", childContent, ct);
                var childJson = JsonSerializer.Deserialize<JsonElement>(await childResponse.Content.ReadAsStringAsync(ct));

                if (childJson.TryGetProperty("error", out var childErr))
                    return new PublishResult(false, null, childErr.GetProperty("message").GetString());

                childIds.Add(childJson.GetProperty("id").GetString()!);
            }

            var carouselContent = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["media_type"] = "CAROUSEL",
                ["children"] = string.Join(",", childIds),
                ["caption"] = caption,
                ["access_token"] = token
            });
            var carouselResponse = await _http.PostAsync($"https://graph.instagram.com/v21.0/{igId}/media", carouselContent, ct);
            var carouselJson = JsonSerializer.Deserialize<JsonElement>(await carouselResponse.Content.ReadAsStringAsync(ct));

            if (carouselJson.TryGetProperty("error", out var carouselErr))
                return new PublishResult(false, null, carouselErr.GetProperty("message").GetString());

            mediaContainerId = carouselJson.GetProperty("id").GetString()!;
        }

        // Esperar a que Instagram procese el media container (máx 30 segundos)
        var ready = await WaitForMediaReadyAsync(mediaContainerId, token, ct);
        if (!ready)
            return new PublishResult(false, null, "El media no terminó de procesarse. Intenta nuevamente.");

        var publishContent = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["creation_id"] = mediaContainerId,
            ["access_token"] = token
        });
        var publishResponse = await _http.PostAsync($"https://graph.instagram.com/v21.0/{igId}/media_publish", publishContent, ct);
        var publishJson = JsonSerializer.Deserialize<JsonElement>(await publishResponse.Content.ReadAsStringAsync(ct));

        if (publishJson.TryGetProperty("error", out var publishErr))
            return new PublishResult(false, null, publishErr.GetProperty("message").GetString());

        var platformPostId = publishJson.GetProperty("id").GetString();
        return new PublishResult(true, platformPostId, null);
    }

    private async Task<SocialAccount> UpsertAsync(int userId, string igId, string username, string name, string? pic, string token)
    {
        var encryptedToken = _protector.Protect(token);
        var existing = await _db.SocialAccounts.FirstOrDefaultAsync(a =>
            a.PlatformUserId == igId && a.UserId == userId && a.Platform == SocialPlatform.Instagram);

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
            Platform = SocialPlatform.Instagram,
            PlatformUserId = igId,
            Username = username,
            Name = name,
            ProfilePictureUrl = pic,
            AccessToken = encryptedToken,
            TokenExpiresAt = DateTime.UtcNow.AddDays(60)
        };
        _db.SocialAccounts.Add(account);
        return account;
    }

    public async Task<SocialAccount> ConnectWithTokenAsync(string accessToken, int userId)
    {
        SocialAccount account;

        // Intentar siempre primero como token de Instagram directo
        var igAccount = await TryConnectInstagramDirectAsync(accessToken, userId);
        if (igAccount != null)
        {
            await _db.SaveChangesAsync();
            return igAccount;
        }

        if (accessToken.StartsWith("IG", StringComparison.OrdinalIgnoreCase))
        {
            var longLived = await ExchangeInstagramLongLivedTokenAsync(accessToken);
            account = await ConnectInstagramTokenAsync(longLived, userId);
        }
        else
        {
            // Intercambiar user token corto por long-lived (60 días) antes de obtener páginas
            var longLivedUserToken = await ExchangeFacebookLongLivedTokenAsync(accessToken);

            var pagesResponse = await _http.GetStringAsync(
                $"https://graph.facebook.com/v18.0/me/accounts?access_token={longLivedUserToken}");
            var pagesData = JsonSerializer.Deserialize<JsonElement>(pagesResponse);

            if (pagesData.TryGetProperty("error", out var pagesErr))
                throw new InvalidOperationException($"Error al obtener páginas: {pagesErr.GetProperty("message").GetString()}");

            var pages = pagesData.GetProperty("data").EnumerateArray().ToList();

            if (pages.Count == 0)
                throw new InvalidOperationException(
                    "Este token no tiene páginas de Facebook asociadas. Asegúrate de tener el permiso 'pages_show_list' y gestionar al menos una página.");

            SocialAccount? found = null;
            foreach (var page in pages)
            {
                var pageId = page.GetProperty("id").GetString()!;
                // Con un long-lived user token, los page tokens de /me/accounts son también long-lived
                var pageToken = page.TryGetProperty("access_token", out var pt) ? pt.GetString()! : longLivedUserToken;

                var igData = JsonSerializer.Deserialize<JsonElement>(
                    await _http.GetStringAsync(
                        $"https://graph.facebook.com/v18.0/{pageId}?fields=instagram_business_account&access_token={pageToken}"));

                if (!igData.TryGetProperty("instagram_business_account", out var igBizAccount)) continue;

                var igId = igBizAccount.GetProperty("id").GetString()!;
                var igInfo = JsonSerializer.Deserialize<JsonElement>(
                    await _http.GetStringAsync(
                        $"https://graph.facebook.com/v18.0/{igId}?fields=username,name,profile_picture_url&access_token={pageToken}"));

                found = await UpsertAsync(userId, igId,
                    igInfo.TryGetProperty("username", out var u) ? u.GetString() ?? "" : "",
                    igInfo.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "",
                    igInfo.TryGetProperty("profile_picture_url", out var pic) ? pic.GetString() : null,
                    pageToken);
                break;
            }

            if (found == null)
                throw new InvalidOperationException(
                    "No se encontró ninguna cuenta de Instagram Business vinculada a las páginas de este token.");

            account = found;
        }

        await _db.SaveChangesAsync();
        return account;
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

    private async Task<string> ExchangeInstagramLongLivedTokenAsync(string shortToken)
    {
        try
        {
            var igAppId = !string.IsNullOrEmpty(_meta.InstagramAppId) ? _meta.InstagramAppId : _meta.AppId;
            var igAppSecret = !string.IsNullOrEmpty(_meta.InstagramAppSecret) ? _meta.InstagramAppSecret : _meta.AppSecret;

            var url = $"https://graph.instagram.com/access_token" +
                      $"?grant_type=ig_exchange_token" +
                      $"&client_id={igAppId}" +
                      $"&client_secret={igAppSecret}" +
                      $"&access_token={shortToken}";

            var raw = await _http.GetStringAsync(url);
            var response = JsonSerializer.Deserialize<JsonElement>(raw);

            if (response.TryGetProperty("error", out var err))
            {
                _logger.LogWarning("No se pudo intercambiar IG token: {Err}. Usando token original.", err.GetProperty("message").GetString());
                return shortToken;
            }

            return response.GetProperty("access_token").GetString()!;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Exchange IG token falló. Usando token original.");
            return shortToken;
        }
    }

    private async Task<bool> WaitForMediaReadyAsync(string containerId, string token, CancellationToken ct)
    {
        for (var i = 0; i < 10; i++)
        {
            await Task.Delay(3000, ct);
            try
            {
                var raw = await _http.GetStringAsync(
                    $"https://graph.instagram.com/v21.0/{containerId}?fields=status_code&access_token={token}", ct);
                var data = JsonSerializer.Deserialize<JsonElement>(raw);

                if (data.TryGetProperty("status_code", out var status))
                {
                    var statusStr = status.GetString();
                    _logger.LogInformation("Media container {Id} status: {Status}", containerId, statusStr);
                    if (statusStr == "FINISHED") return true;
                    if (statusStr == "ERROR" || statusStr == "EXPIRED") return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error checking media status for {Id}", containerId);
            }
        }
        return false;
    }

    private async Task<SocialAccount?> TryConnectInstagramDirectAsync(string accessToken, int userId)
    {
        // Intentar múltiples versiones y campos del endpoint de Instagram
        var igEndpoints = new[]
        {
            "https://graph.instagram.com/v21.0/me?fields=id,username,name,profile_picture_url",
            "https://graph.instagram.com/v21.0/me?fields=user_id,username,name,profile_picture_url",
            "https://graph.instagram.com/me?fields=id,username,name,profile_picture_url",
            "https://graph.instagram.com/me?fields=user_id,username,name,profile_picture_url",
        };

        foreach (var endpoint in igEndpoints)
        {
            try
            {
                var raw = await _http.GetStringAsync($"{endpoint}&access_token={accessToken}");
                var data = JsonSerializer.Deserialize<JsonElement>(raw);
                if (data.TryGetProperty("error", out _)) continue;

                var igId = data.TryGetProperty("id", out var id1) ? id1.GetString()
                         : data.TryGetProperty("user_id", out var uid) ? uid.GetString()
                         : null;

                if (igId == null) continue;

                return await UpsertAsync(userId, igId,
                    data.TryGetProperty("username", out var u) ? u.GetString() ?? "" : "",
                    data.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "",
                    data.TryGetProperty("profile_picture_url", out var pic) ? pic.GetString() : null,
                    accessToken);
            }
            catch { }
        }

        return null;
    }

    private async Task<SocialAccount> ConnectInstagramTokenAsync(string accessToken, int userId)
    {
        var meData = JsonSerializer.Deserialize<JsonElement>(
            await _http.GetStringAsync($"https://graph.instagram.com/v18.0/me?fields=id,username,name,profile_picture_url&access_token={accessToken}"));

        var igId = meData.GetProperty("id").GetString()!;
        return await UpsertAsync(userId, igId,
            meData.TryGetProperty("username", out var u) ? u.GetString() ?? "" : "",
            meData.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "",
            meData.TryGetProperty("profile_picture_url", out var pic) ? pic.GetString() : null,
            accessToken);
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
