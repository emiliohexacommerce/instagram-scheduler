namespace InstagramScheduler.API.Options;

public class JwtOptions
{
    public string Secret { get; set; } = string.Empty;
    public int ExpiryHours { get; set; } = 24;
    public int RefreshExpiryDays { get; set; } = 30;
}
