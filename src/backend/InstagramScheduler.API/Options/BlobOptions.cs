namespace InstagramScheduler.API.Options;

public class BlobOptions
{
    public string ConnectionString { get; set; } = string.Empty;
    public string MediaContainer { get; set; } = "social-hexa";
    public string ThumbnailContainer { get; set; } = "social-hexa";
    public int SasExpiryHours { get; set; } = 2;
}
