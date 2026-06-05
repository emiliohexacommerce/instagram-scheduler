namespace InstagramScheduler.API.DTOs;

public record PlanResponse(
    int Id,
    string Name,
    string Description,
    decimal PriceMonthly,
    int MaxAccounts,
    int MaxPostsPerMonth,
    int MaxPostsPerWeek,
    bool IsUnlimited,
    int SortOrder
);

public record SubscriptionResponse(
    int Id,
    int PlanId,
    string PlanName,
    string Status,
    bool IsTrial,
    DateTime StartDate,
    DateTime EndDate,
    int DaysRemaining,
    decimal PriceMonthly
);

public record CheckoutRequest(int PlanId);

public record CheckoutResponse(string PaymentUrl, string Token, string OrderId);
