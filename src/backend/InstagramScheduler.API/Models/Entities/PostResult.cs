namespace InstagramScheduler.API.Models.Entities;

public class PostResult
{
    public SocialPlatform Platform { get; set; }
    public PostStatus Status { get; set; }
    public string? PlatformPostId { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime? PublishedAt { get; set; }
}
