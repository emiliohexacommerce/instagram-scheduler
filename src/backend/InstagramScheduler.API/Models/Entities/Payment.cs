namespace InstagramScheduler.API.Models.Entities;

public enum PaymentStatus
{
    Pending,
    Completed,
    Failed,
    Annulled
}

public class Payment
{
    public int Id { get; set; }
    public int SubscriptionId { get; set; }
    public Subscription Subscription { get; set; } = null!;
    public decimal Amount { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public string? TransbankToken { get; set; }
    public string? TransbankOrderId { get; set; }
    public string? TransbankAuthCode { get; set; }
    public string? TransbankCardNumber { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PaidAt { get; set; }
}
