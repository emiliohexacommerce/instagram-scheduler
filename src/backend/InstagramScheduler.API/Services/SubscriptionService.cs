using InstagramScheduler.API.Data;
using InstagramScheduler.API.DTOs;
using InstagramScheduler.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace InstagramScheduler.API.Services;

public class SubscriptionService : ISubscriptionService
{
    private readonly AppDbContext _db;

    public SubscriptionService(AppDbContext db) => _db = db;

    public async Task<Subscription?> GetActiveSubscriptionAsync(int userId) =>
        await _db.Subscriptions
            .Include(s => s.Plan)
            .Where(s => s.UserId == userId &&
                (s.Status == SubscriptionStatus.Trial ||
                 s.Status == SubscriptionStatus.Active ||
                 s.Status == SubscriptionStatus.PendingPayment))
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync();

    public async Task<SubscriptionResponse?> GetActiveSubscriptionResponseAsync(int userId)
    {
        var sub = await GetActiveSubscriptionAsync(userId);
        if (sub == null) return null;
        return MapToResponse(sub);
    }

    public async Task<Subscription> CreateTrialAsync(int userId, int planId)
    {
        var existing = await _db.Subscriptions
            .AnyAsync(s => s.UserId == userId);

        if (existing)
            throw new InvalidOperationException("El usuario ya tiene una suscripción.");

        var sub = new Subscription
        {
            UserId = userId,
            PlanId = planId,
            Status = SubscriptionStatus.Trial,
            IsTrial = true,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(30)
        };

        _db.Subscriptions.Add(sub);
        await _db.SaveChangesAsync();
        return sub;
    }

    public async Task<bool> CanAddAccountAsync(int userId)
    {
        var sub = await GetActiveSubscriptionAsync(userId);
        if (sub == null || !IsValid(sub)) return false;
        if (sub.Plan.IsUnlimited) return true;

        var accountCount = await _db.SocialAccounts
            .CountAsync(a => a.UserId == userId && a.IsActive);

        return accountCount < sub.Plan.MaxAccounts;
    }

    public async Task<bool> CanPublishPostAsync(int userId)
    {
        var sub = await GetActiveSubscriptionAsync(userId);
        if (sub == null || !IsValid(sub)) return false;
        if (sub.Plan.IsUnlimited) return true;

        var now = DateTime.UtcNow;
        var weekStart = now.AddDays(-(int)now.DayOfWeek);
        var monthStart = new DateTime(now.Year, now.Month, 1);

        var weekCount = await _db.ScheduledPosts
            .CountAsync(p => p.UserId == userId &&
                p.Results.Any() &&
                p.CreatedAt >= weekStart);

        if (weekCount >= sub.Plan.MaxPostsPerWeek) return false;

        var monthCount = await _db.ScheduledPosts
            .CountAsync(p => p.UserId == userId &&
                p.CreatedAt >= monthStart);

        return monthCount < sub.Plan.MaxPostsPerMonth;
    }

    public async Task ActivateAfterPaymentAsync(int subscriptionId, int planId, DateTime endDate)
    {
        var sub = await _db.Subscriptions.FindAsync(subscriptionId)
            ?? throw new KeyNotFoundException("Suscripción no encontrada.");

        sub.PlanId = planId;
        sub.Status = SubscriptionStatus.Active;
        sub.IsTrial = false;
        sub.StartDate = DateTime.UtcNow;
        sub.EndDate = endDate;
        sub.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<bool> IsActiveAsync(int userId)
    {
        var sub = await GetActiveSubscriptionAsync(userId);
        return sub != null && IsValid(sub);
    }

    private static bool IsValid(Subscription sub) =>
        sub.EndDate > DateTime.UtcNow &&
        sub.Status != SubscriptionStatus.Suspended &&
        sub.Status != SubscriptionStatus.Cancelled;

    private static SubscriptionResponse MapToResponse(Subscription s) => new(
        s.Id,
        s.PlanId,
        s.Plan.Name,
        s.Status.ToString(),
        s.IsTrial,
        s.StartDate,
        s.EndDate,
        Math.Max(0, (int)(s.EndDate - DateTime.UtcNow).TotalDays),
        s.Plan.PriceMonthly
    );
}
