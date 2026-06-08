using InstagramScheduler.API.Data;
using InstagramScheduler.API.DTOs;
using InstagramScheduler.API.Models.Entities;
using InstagramScheduler.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace InstagramScheduler.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAccountService _accounts;
    private readonly HttpClient _http;
    private readonly IDataProtector _protector;

    public AnalyticsController(AppDbContext db, IAccountService accounts,
        IHttpClientFactory httpFactory, IDataProtectionProvider dp)
    {
        _db = db;
        _accounts = accounts;
        _http = httpFactory.CreateClient();
        _protector = dp.CreateProtector("InstagramScheduler.AccessTokens");
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<AnalyticsOverviewResponse>> GetOverview([FromQuery] int days = 30)
    {
        var posts = await _db.ScheduledPosts
            .Where(p => p.UserId == UserId)
            .ToListAsync();

        var totalPosts = posts.Count;
        var published = posts.Count(p => p.Status == PostStatus.Published);
        var failed = posts.Count(p => p.Status == PostStatus.Failed);
        var scheduled = posts.Count(p => p.Status == PostStatus.Scheduled || p.Status == PostStatus.Processing);
        var draft = posts.Count(p => p.Status == PostStatus.Draft);

        var successRate = published + failed > 0
            ? Math.Round((double)published / (published + failed) * 100, 1)
            : 0.0;

        var now = DateTime.UtcNow;
        var weekStart = now.AddDays(-(int)now.DayOfWeek);
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var thisWeek = posts.Count(p => p.Status == PostStatus.Published && p.UpdatedAt >= weekStart);
        var thisMonth = posts.Count(p => p.Status == PostStatus.Published && p.UpdatedAt >= monthStart);

        // Platform breakdown from Results JSON
        var platformStats = new Dictionary<string, (int total, int pub, int fail)>();
        foreach (var post in posts)
        {
            foreach (var result in post.Results)
            {
                var key = result.Platform.ToString();
                if (!platformStats.ContainsKey(key)) platformStats[key] = (0, 0, 0);
                var (t, p, f) = platformStats[key];
                platformStats[key] = (
                    t + 1,
                    result.Status == PostStatus.Published ? p + 1 : p,
                    result.Status == PostStatus.Failed ? f + 1 : f
                );
            }
        }

        var platformBreakdown = platformStats
            .Select(kv => new PlatformStatDto(kv.Key, kv.Value.total, kv.Value.pub, kv.Value.fail))
            .OrderByDescending(x => x.Total)
            .ToList();

        // Timeline: last N days
        var since = now.AddDays(-days).Date;
        var timelineDict = new Dictionary<string, (int pub, int fail)>();

        foreach (var post in posts)
        {
            foreach (var result in post.Results)
            {
                var date = (result.PublishedAt ?? post.UpdatedAt).Date;
                if (date < since) continue;
                var key = date.ToString("yyyy-MM-dd");
                if (!timelineDict.ContainsKey(key)) timelineDict[key] = (0, 0);
                var (p, f) = timelineDict[key];
                timelineDict[key] = (
                    result.Status == PostStatus.Published ? p + 1 : p,
                    result.Status == PostStatus.Failed ? f + 1 : f
                );
            }
        }

        var timeline = Enumerable.Range(0, days)
            .Select(i => since.AddDays(i).ToString("yyyy-MM-dd"))
            .Select(d =>
            {
                var (p, f) = timelineDict.GetValueOrDefault(d, (0, 0));
                return new TimelinePointDto(d, p, f);
            })
            .ToList();

        return Ok(new AnalyticsOverviewResponse(
            totalPosts, published, failed, scheduled, draft,
            successRate, thisWeek, thisMonth,
            platformBreakdown, timeline
        ));
    }

    [HttpGet("insights/{accountId:int}")]
    public async Task<ActionResult<AccountInsightsResponse>> GetInsights(int accountId)
    {
        var account = await _accounts.GetAccountByIdAsync(accountId, UserId);
        if (account == null) return NotFound();

        string token;
        try { token = _protector.Unprotect(account.AccessToken); }
        catch { return Ok(new AccountInsightsResponse(account.Id, account.Platform.ToString(), account.Username, account.ProfilePictureUrl, null, null)); }

        if (account.Platform == SocialPlatform.Instagram)
            return Ok(await GetInstagramInsightsAsync(account, token));
        if (account.Platform == SocialPlatform.Facebook)
            return Ok(await GetFacebookInsightsAsync(account, token));

        return Ok(new AccountInsightsResponse(account.Id, account.Platform.ToString(), account.Username, account.ProfilePictureUrl, null, null));
    }

    private async Task<AccountInsightsResponse> GetInstagramInsightsAsync(SocialAccount account, string token)
    {
        try
        {
            var resp = await _http.GetAsync(
                $"https://graph.facebook.com/v19.0/{account.PlatformUserId}?fields=followers_count,media_count&access_token={token}");
            if (!resp.IsSuccessStatusCode)
                return new AccountInsightsResponse(account.Id, "Instagram", account.Username, account.ProfilePictureUrl, null, null);

            var json = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
            var followers = json.RootElement.TryGetProperty("followers_count", out var fc) ? fc.GetInt64() : (long?)null;
            var media = json.RootElement.TryGetProperty("media_count", out var mc) ? mc.GetInt64() : (long?)null;

            return new AccountInsightsResponse(account.Id, "Instagram", account.Username, account.ProfilePictureUrl, followers, media);
        }
        catch
        {
            return new AccountInsightsResponse(account.Id, "Instagram", account.Username, account.ProfilePictureUrl, null, null);
        }
    }

    private async Task<AccountInsightsResponse> GetFacebookInsightsAsync(SocialAccount account, string token)
    {
        try
        {
            var resp = await _http.GetAsync(
                $"https://graph.facebook.com/v19.0/{account.PlatformUserId}?fields=fan_count&access_token={token}");
            if (!resp.IsSuccessStatusCode)
                return new AccountInsightsResponse(account.Id, "Facebook", account.Username, account.ProfilePictureUrl, null, null);

            var json = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
            var followers = json.RootElement.TryGetProperty("fan_count", out var fc) ? fc.GetInt64() : (long?)null;

            return new AccountInsightsResponse(account.Id, "Facebook", account.Username, account.ProfilePictureUrl, followers, null);
        }
        catch
        {
            return new AccountInsightsResponse(account.Id, "Facebook", account.Username, account.ProfilePictureUrl, null, null);
        }
    }
}
