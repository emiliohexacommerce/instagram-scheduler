using InstagramScheduler.API.DTOs;
using InstagramScheduler.API.Models.Entities;
using InstagramScheduler.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text.Json;

namespace InstagramScheduler.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InboxController : ControllerBase
{
    private readonly IAccountService _accounts;
    private readonly HttpClient _http;
    private readonly IDataProtector _protector;
    private readonly ILogger<InboxController> _logger;

    public InboxController(IAccountService accounts, IHttpClientFactory httpFactory,
        IDataProtectionProvider dp, ILogger<InboxController> logger)
    {
        _accounts = accounts;
        _http = httpFactory.CreateClient();
        _protector = dp.CreateProtector("InstagramScheduler.AccessTokens");
        _logger = logger;
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<InboxPostDto>>> GetInbox([FromQuery] int? accountId = null)
    {
        List<SocialAccount> accs;
        if (accountId.HasValue)
        {
            var acc = await _accounts.GetAccountByIdAsync(accountId.Value, UserId);
            accs = acc != null ? [acc] : [];
        }
        else
        {
            accs = await _accounts.GetAccountsByUserAsync(UserId);
        }

        var posts = new List<InboxPostDto>();
        foreach (var acc in accs)
        {
            if (acc.Platform is not (SocialPlatform.Instagram or SocialPlatform.Facebook)) continue;

            string token;
            try { token = _protector.Unprotect(acc.AccessToken); }
            catch { continue; }

            try
            {
                var fetched = acc.Platform == SocialPlatform.Instagram
                    ? await GetInstagramPostsAsync(acc, token)
                    : await GetFacebookPostsAsync(acc, token);
                posts.AddRange(fetched);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Inbox fetch failed for account {Id}: {Msg}", acc.Id, ex.Message);
            }
        }

        return Ok(posts.OrderByDescending(p => p.PostedAt).ToList());
    }

    [HttpPost("reply")]
    public async Task<IActionResult> Reply([FromBody] ReplyRequest request)
    {
        var acc = await _accounts.GetAccountByIdAsync(request.AccountId, UserId);
        if (acc == null) return NotFound("Cuenta no encontrada.");

        string token;
        try { token = _protector.Unprotect(acc.AccessToken); }
        catch { return BadRequest("Token inválido."); }

        if (acc.Platform == SocialPlatform.Instagram)
        {
            var resp = await _http.PostAsync(
                $"https://graph.facebook.com/v19.0/{request.CommentId}/replies?access_token={token}",
                new FormUrlEncodedContent(new Dictionary<string, string> { ["message"] = request.Message }));

            if (!resp.IsSuccessStatusCode)
            {
                var err = await resp.Content.ReadAsStringAsync();
                return BadRequest($"Error al responder: {err}");
            }
        }
        else if (acc.Platform == SocialPlatform.Facebook)
        {
            var resp = await _http.PostAsync(
                $"https://graph.facebook.com/v19.0/{request.CommentId}/comments?access_token={token}",
                new FormUrlEncodedContent(new Dictionary<string, string> { ["message"] = request.Message }));

            if (!resp.IsSuccessStatusCode)
            {
                var err = await resp.Content.ReadAsStringAsync();
                return BadRequest($"Error al responder: {err}");
            }
        }

        return Ok();
    }

    private async Task<List<InboxPostDto>> GetInstagramPostsAsync(SocialAccount acc, string token)
    {
        var mediaResp = await _http.GetAsync(
            $"https://graph.facebook.com/v19.0/{acc.PlatformUserId}/media" +
            $"?fields=id,caption,media_url,thumbnail_url,timestamp,comments_count" +
            $"&limit=10&access_token={token}");

        if (!mediaResp.IsSuccessStatusCode) return [];

        var mediaJson = JsonDocument.Parse(await mediaResp.Content.ReadAsStringAsync());
        if (!mediaJson.RootElement.TryGetProperty("data", out var mediaData)) return [];

        var posts = new List<InboxPostDto>();
        foreach (var media in mediaData.EnumerateArray())
        {
            var mediaId = media.GetProperty("id").GetString()!;
            var caption = media.TryGetProperty("caption", out var c) ? c.GetString() ?? "" : "";
            var mediaUrl = media.TryGetProperty("media_url", out var mu) ? mu.GetString()
                         : media.TryGetProperty("thumbnail_url", out var tu) ? tu.GetString()
                         : null;
            var timestamp = media.TryGetProperty("timestamp", out var ts)
                ? DateTime.Parse(ts.GetString()!)
                : DateTime.UtcNow;
            var commentsCount = media.TryGetProperty("comments_count", out var cc) ? cc.GetInt32() : 0;

            var comments = await GetInstagramCommentsAsync(mediaId, token);

            posts.Add(new InboxPostDto(
                mediaId, "Instagram", acc.Id,
                acc.Username, acc.ProfilePictureUrl,
                caption, mediaUrl, timestamp, commentsCount, comments));
        }

        return posts;
    }

    private async Task<List<InboxCommentDto>> GetInstagramCommentsAsync(string mediaId, string token)
    {
        var resp = await _http.GetAsync(
            $"https://graph.facebook.com/v19.0/{mediaId}/comments" +
            $"?fields=id,text,username,timestamp,replies{{id,text,username,timestamp}}" +
            $"&limit=25&access_token={token}");

        if (!resp.IsSuccessStatusCode) return [];

        var json = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        if (!json.RootElement.TryGetProperty("data", out var data)) return [];

        return data.EnumerateArray().Select(c =>
        {
            var replies = new List<InboxReplyDto>();
            if (c.TryGetProperty("replies", out var r) && r.TryGetProperty("data", out var rd))
            {
                replies = rd.EnumerateArray().Select(rep => new InboxReplyDto(
                    rep.GetProperty("id").GetString()!,
                    rep.TryGetProperty("username", out var u) ? u.GetString() ?? "usuario" : "usuario",
                    rep.TryGetProperty("text", out var t) ? t.GetString() ?? "" : "",
                    rep.TryGetProperty("timestamp", out var ts) ? DateTime.Parse(ts.GetString()!) : DateTime.UtcNow
                )).ToList();
            }
            return new InboxCommentDto(
                c.GetProperty("id").GetString()!,
                c.TryGetProperty("username", out var cu) ? cu.GetString() ?? "usuario" : "usuario",
                c.TryGetProperty("text", out var ct) ? ct.GetString() ?? "" : "",
                c.TryGetProperty("timestamp", out var cts) ? DateTime.Parse(cts.GetString()!) : DateTime.UtcNow,
                replies
            );
        }).ToList();
    }

    private async Task<List<InboxPostDto>> GetFacebookPostsAsync(SocialAccount acc, string token)
    {
        var feedResp = await _http.GetAsync(
            $"https://graph.facebook.com/v19.0/{acc.PlatformUserId}/posts" +
            $"?fields=id,message,created_time,full_picture,comments{{id,message,from,created_time}}" +
            $"&limit=10&access_token={token}");

        if (!feedResp.IsSuccessStatusCode) return [];

        var feedJson = JsonDocument.Parse(await feedResp.Content.ReadAsStringAsync());
        if (!feedJson.RootElement.TryGetProperty("data", out var feedData)) return [];

        var posts = new List<InboxPostDto>();
        foreach (var post in feedData.EnumerateArray())
        {
            var postId = post.GetProperty("id").GetString()!;
            var message = post.TryGetProperty("message", out var m) ? m.GetString() ?? "" : "";
            var picture = post.TryGetProperty("full_picture", out var p) ? p.GetString() : null;
            var createdTime = post.TryGetProperty("created_time", out var ct)
                ? DateTime.Parse(ct.GetString()!)
                : DateTime.UtcNow;

            var comments = new List<InboxCommentDto>();
            if (post.TryGetProperty("comments", out var commentsEl) &&
                commentsEl.TryGetProperty("data", out var commentsData))
            {
                comments = commentsData.EnumerateArray().Select(c =>
                {
                    var from = c.TryGetProperty("from", out var f) ? f : default;
                    var authorName = from.ValueKind != JsonValueKind.Undefined && from.TryGetProperty("name", out var n)
                        ? n.GetString() ?? "usuario" : "usuario";
                    return new InboxCommentDto(
                        c.GetProperty("id").GetString()!,
                        authorName,
                        c.TryGetProperty("message", out var msg) ? msg.GetString() ?? "" : "",
                        c.TryGetProperty("created_time", out var ts) ? DateTime.Parse(ts.GetString()!) : DateTime.UtcNow,
                        []
                    );
                }).ToList();
            }

            posts.Add(new InboxPostDto(
                postId, "Facebook", acc.Id,
                acc.Username, acc.ProfilePictureUrl,
                message, picture, createdTime, comments.Count, comments));
        }

        return posts;
    }
}
