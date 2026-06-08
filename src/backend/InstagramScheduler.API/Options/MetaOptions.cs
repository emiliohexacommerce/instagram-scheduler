namespace InstagramScheduler.API.Options;

public class MetaOptions
{
    public string AppId { get; set; } = string.Empty;
    public string AppSecret { get; set; } = string.Empty;
    public string RedirectUri { get; set; } = string.Empty;
    public string InstagramAppId { get; set; } = string.Empty;
    public string InstagramAppSecret { get; set; } = string.Empty;
    public string ThreadsAppId { get; set; } = string.Empty;
    public string ThreadsAppSecret { get; set; } = string.Empty;
    // Threads requires HTTPS redirect URI even in development
    public string ThreadsRedirectUri { get; set; } = string.Empty;
}
