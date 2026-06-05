namespace InstagramScheduler.API.Models.Entities;

public class Plan
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal PriceMonthly { get; set; }
    public int MaxAccounts { get; set; }
    public int MaxPostsPerMonth { get; set; }
    public int MaxPostsPerWeek { get; set; }
    public bool IsUnlimited { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
    public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
}
