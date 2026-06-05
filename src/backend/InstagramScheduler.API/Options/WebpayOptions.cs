namespace InstagramScheduler.API.Options;

public class WebpayOptions
{
    public string CommerceCode { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public bool IsProduction { get; set; } = false;
    public string ReturnUrl { get; set; } = string.Empty;
}
