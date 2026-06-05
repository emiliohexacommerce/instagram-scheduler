using InstagramScheduler.API.DTOs;
using InstagramScheduler.API.Models.Entities;

namespace InstagramScheduler.API.Services;

public interface ISubscriptionService
{
    Task<Subscription?> GetActiveSubscriptionAsync(int userId);
    Task<SubscriptionResponse?> GetActiveSubscriptionResponseAsync(int userId);
    Task<Subscription> CreateTrialAsync(int userId, int planId);
    Task<bool> CanAddAccountAsync(int userId);
    Task<bool> CanPublishPostAsync(int userId);
    Task ActivateAfterPaymentAsync(int subscriptionId, int planId, DateTime endDate);
    Task<bool> IsActiveAsync(int userId);
}
