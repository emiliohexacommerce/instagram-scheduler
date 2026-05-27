using InstagramScheduler.API.Data;
using InstagramScheduler.API.Models.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace InstagramScheduler.API.Services;

public class InstagramService : IInstagramService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly HttpClient _http;
    private readonly ILogger<InstagramService> _logger;

    public InstagramService(AppDbContext db, IConfiguration config,
        IHttpClientFactory httpFactory, ILogger<InstagramService> logger)
    {
        _db = db;
        _config = config;
        _http = httpFactory.CreateClient();
        _logger = logger;
    }

    public string GetAuthUrl(int userId)
    {
        var appId = _config["META_APP_ID"];
        var redirectUri = Uri.EscapeDataString(_config["META_REDIRECT_URI"] ?? "");
        var scopes = "instagram_basic,instagram_content_publish,pages_read_engagement";
        return $"https://www.facebook.com/v18.0/dialog/oauth?client_id={appId}&redirect_uri={redirectUri}&scope={scopes}&state={userId}";
    }

    public Task<string> GetAuthUrlAsync(int userId) =>
        Task.FromResult(GetAuthUrl(userId));

    public async Task HandleCallbackAsync(string code, int userId)
    {
        var appId = _config["META_APP_ID"];
        var appSecret = _config["META_APP_SECRET"];
        var redirectUri = _config["META_REDIRECT_URI"];

        // Obtener access token
        var tokenUrl = $"https://graph.facebook.com/v18.0/oauth/access_token" +
            $"?client_id={appId}&redirect_uri={redirectUri}" +
            $"&client_secret={appSecret}&code={code}";

        var tokenResponse = await _http.GetStringAsync(tokenUrl);
        var tokenData = JsonSerializer.Deserialize<JsonElement>(tokenResponse);
        var accessToken = tokenData.GetProperty("access_token").GetString()!;

        // Obtener cuentas de Instagram vinculadas
        var accountsUrl = $"https://graph.facebook.com/v18.0/me/accounts?access_token={accessToken}";
        var accountsResponse = await _http.GetStringAsync(accountsUrl);
        _logger.LogInformation("Pages response: {Response}", accountsResponse);
        var accountsData = JsonSerializer.Deserialize<JsonElement>(accountsResponse);

        foreach (var page in accountsData.GetProperty("data").EnumerateArray())
        {
            var pageId = page.GetProperty("id").GetString()!;
            var pageToken = page.GetProperty("access_token").GetString()!;

            var igUrl = $"https://graph.facebook.com/v18.0/{pageId}?fields=instagram_business_account&access_token={pageToken}";
            var igResponse = await _http.GetStringAsync(igUrl);
            _logger.LogInformation("IG account for page {PageId}: {Response}", pageId, igResponse);
            var igData = JsonSerializer.Deserialize<JsonElement>(igResponse);

            if (!igData.TryGetProperty("instagram_business_account", out var igAccount)) continue;

            var igId = igAccount.GetProperty("id").GetString()!;
            var igInfoUrl = $"https://graph.facebook.com/v18.0/{igId}?fields=username,name,profile_picture_url&access_token={pageToken}";
            var igInfo = JsonSerializer.Deserialize<JsonElement>(await _http.GetStringAsync(igInfoUrl));

            var existing = await _db.InstagramAccounts.FirstOrDefaultAsync(a =>
                a.InstagramUserId == igId && a.UserId == userId);

            if (existing != null)
            {
                existing.AccessToken = pageToken;
                existing.TokenExpiresAt = DateTime.UtcNow.AddDays(60);
            }
            else
            {
                _db.InstagramAccounts.Add(new InstagramAccount
                {
                    UserId = userId,
                    InstagramUserId = igId,
                    Username = igInfo.GetProperty("username").GetString() ?? "",
                    Name = igInfo.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "",
                    ProfilePictureUrl = igInfo.TryGetProperty("profile_picture_url", out var pic) ? pic.GetString() : null,
                    AccessToken = pageToken,
                    TokenExpiresAt = DateTime.UtcNow.AddDays(60)
                });
            }
        }

        await _db.SaveChangesAsync();
    }

    public async Task ConnectWithTokenAsync(string accessToken, int userId)
    {
        // Token de Instagram directo (empieza con "IG") — usar Instagram Graph API
        if (accessToken.StartsWith("IG", StringComparison.OrdinalIgnoreCase))
        {
            await ConnectInstagramTokenAsync(accessToken, userId);
            return;
        }

        // Token de Facebook — buscar páginas con Instagram Business vinculado
        var accountsUrl = $"https://graph.facebook.com/v18.0/me/accounts?access_token={accessToken}";
        var accountsResponse = await _http.GetStringAsync(accountsUrl);
        var accountsData = JsonSerializer.Deserialize<JsonElement>(accountsResponse);
        var pages = accountsData.GetProperty("data").EnumerateArray().ToList();

        var found = false;
        foreach (var page in pages)
        {
            var pageId = page.GetProperty("id").GetString()!;
            var pageToken = page.GetProperty("access_token").GetString()!;

            var igUrl = $"https://graph.facebook.com/v18.0/{pageId}?fields=instagram_business_account&access_token={pageToken}";
            var igData = JsonSerializer.Deserialize<JsonElement>(await _http.GetStringAsync(igUrl));

            if (!igData.TryGetProperty("instagram_business_account", out var igAccount)) continue;
            found = true;

            var igId = igAccount.GetProperty("id").GetString()!;
            var igInfo = JsonSerializer.Deserialize<JsonElement>(
                await _http.GetStringAsync($"https://graph.facebook.com/v18.0/{igId}?fields=username,name,profile_picture_url&access_token={pageToken}"));

            await UpsertAccountAsync(userId, igId,
                igInfo.TryGetProperty("username", out var u) ? u.GetString() ?? "" : "",
                igInfo.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "",
                igInfo.TryGetProperty("profile_picture_url", out var pic) ? pic.GetString() : null,
                pageToken);
        }

        // Si no hay páginas con IG Business, intentar el token como Instagram directamente
        if (!found)
            await ConnectInstagramTokenAsync(accessToken, userId);

        await _db.SaveChangesAsync();
    }

    private async Task ConnectInstagramTokenAsync(string accessToken, int userId)
    {
        var meUrl = $"https://graph.instagram.com/v18.0/me?fields=id,username,name,profile_picture_url&access_token={accessToken}";
        var meData = JsonSerializer.Deserialize<JsonElement>(await _http.GetStringAsync(meUrl));

        var igId = meData.GetProperty("id").GetString()!;
        await UpsertAccountAsync(userId, igId,
            meData.TryGetProperty("username", out var u) ? u.GetString() ?? "" : "",
            meData.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "",
            meData.TryGetProperty("profile_picture_url", out var pic) ? pic.GetString() : null,
            accessToken);

        await _db.SaveChangesAsync();
    }

    private async Task UpsertAccountAsync(int userId, string igId, string username, string name, string? pic, string token)
    {
        var existing = await _db.InstagramAccounts.FirstOrDefaultAsync(a =>
            a.InstagramUserId == igId && a.UserId == userId);

        if (existing != null)
        {
            existing.AccessToken = token;
            existing.TokenExpiresAt = DateTime.UtcNow.AddDays(60);
        }
        else
        {
            _db.InstagramAccounts.Add(new InstagramAccount
            {
                UserId = userId,
                InstagramUserId = igId,
                Username = username,
                Name = name,
                ProfilePictureUrl = pic,
                AccessToken = token,
                TokenExpiresAt = DateTime.UtcNow.AddDays(60)
            });
        }
    }

    public async Task PublishPostAsync(int postId)
    {
        var post = await _db.ScheduledPosts
            .Include(p => p.Account)
            .FirstOrDefaultAsync(p => p.Id == postId)
            ?? throw new KeyNotFoundException($"Post {postId} no encontrado.");

        try
        {
            var igId = post.Account.InstagramUserId;
            var token = post.Account.AccessToken;
            var caption = post.Caption + (post.Hashtags != null ? $"\n\n{post.Hashtags}" : "");

            string mediaContainerId;

            if (post.MediaUrls.Count == 1)
            {
                // Single image
                var createUrl = $"https://graph.facebook.com/v18.0/{igId}/media";
                var content = new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["image_url"] = post.MediaUrls[0],
                    ["caption"] = caption,
                    ["access_token"] = token
                });
                var response = await _http.PostAsync(createUrl, content);
                var json = JsonSerializer.Deserialize<JsonElement>(await response.Content.ReadAsStringAsync());
                mediaContainerId = json.GetProperty("id").GetString()!;
            }
            else
            {
                // Carousel
                var childIds = new List<string>();
                foreach (var url in post.MediaUrls)
                {
                    var childContent = new FormUrlEncodedContent(new Dictionary<string, string>
                    {
                        ["image_url"] = url,
                        ["is_carousel_item"] = "true",
                        ["access_token"] = token
                    });
                    var childResponse = await _http.PostAsync(
                        $"https://graph.facebook.com/v18.0/{igId}/media", childContent);
                    var childJson = JsonSerializer.Deserialize<JsonElement>(
                        await childResponse.Content.ReadAsStringAsync());
                    childIds.Add(childJson.GetProperty("id").GetString()!);
                }

                var carouselContent = new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["media_type"] = "CAROUSEL",
                    ["children"] = string.Join(",", childIds),
                    ["caption"] = caption,
                    ["access_token"] = token
                });
                var carouselResponse = await _http.PostAsync(
                    $"https://graph.facebook.com/v18.0/{igId}/media", carouselContent);
                var carouselJson = JsonSerializer.Deserialize<JsonElement>(
                    await carouselResponse.Content.ReadAsStringAsync());
                mediaContainerId = carouselJson.GetProperty("id").GetString()!;
            }

            // Publicar el container
            var publishContent = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["creation_id"] = mediaContainerId,
                ["access_token"] = token
            });
            var publishResponse = await _http.PostAsync(
                $"https://graph.facebook.com/v18.0/{igId}/media_publish", publishContent);
            var publishJson = JsonSerializer.Deserialize<JsonElement>(
                await publishResponse.Content.ReadAsStringAsync());

            post.InstagramPostId = publishJson.GetProperty("id").GetString();
            post.Status = PostStatus.Published;
            post.PublishedAt = DateTime.UtcNow;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error publicando post {PostId}", postId);
            post.Status = PostStatus.Failed;
            post.ErrorMessage = ex.Message;
        }

        post.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }
}
