using InstagramScheduler.API.Data;
using InstagramScheduler.API.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Hangfire;

namespace InstagramScheduler.API.Services;

public class SchedulerJobs
{
    private readonly AppDbContext _db;
    private readonly ILogger<SchedulerJobs> _logger;

    public SchedulerJobs(AppDbContext db, ILogger<SchedulerJobs> logger)
    {
        _db = db;
        _logger = logger;
    }

    [AutomaticRetry(Attempts = 0)]
    public async Task ReconcileScheduledPostsAsync()
    {
        var missed = await _db.ScheduledPosts
            .Where(p => p.Status == PostStatus.Scheduled
                     && p.ScheduledAt < DateTime.UtcNow.AddMinutes(-2))
            .ToListAsync();

        if (missed.Count == 0) return;

        _logger.LogWarning("Reconciliación: {Count} posts programados no ejecutados. Reencolando.", missed.Count);

        foreach (var post in missed)
            BackgroundJob.Enqueue<SocialPublishingService>(s => s.PublishPostAsync(post.Id, CancellationToken.None));
    }

    [AutomaticRetry(Attempts = 0)]
    public async Task CheckExpiringTokensAsync()
    {
        var expiring = await _db.SocialAccounts
            .Include(a => a.User)
            .Where(a => a.IsActive && a.TokenExpiresAt < DateTime.UtcNow.AddDays(7))
            .ToListAsync();

        foreach (var account in expiring)
        {
            var daysLeft = (account.TokenExpiresAt - DateTime.UtcNow).Days;
            _logger.LogWarning(
                "Token próximo a expirar: cuenta {Platform} @{Username} de usuario {Email}. Expira en {Days} días.",
                account.Platform, account.Username, account.User.Email, daysLeft);
        }
    }

    [AutomaticRetry(Attempts = 0)]
    public async Task CheckExpiredSubscriptionsAsync()
    {
        var expired = await _db.Subscriptions
            .Where(s => s.EndDate < DateTime.UtcNow &&
                (s.Status == SubscriptionStatus.Trial || s.Status == SubscriptionStatus.Active))
            .ToListAsync();

        foreach (var sub in expired)
        {
            sub.Status = SubscriptionStatus.PendingPayment;
            sub.UpdatedAt = DateTime.UtcNow;
            _logger.LogWarning("Suscripción {Id} expirada para usuario {UserId}.", sub.Id, sub.UserId);
        }

        if (expired.Count > 0)
            await _db.SaveChangesAsync();
    }

    [AutomaticRetry(Attempts = 0)]
    public Task CleanOrphanedBlobsAsync()
    {
        _logger.LogInformation("CleanOrphanedBlobs: pendiente integración Azure Blob Storage.");
        return Task.CompletedTask;
    }
}
