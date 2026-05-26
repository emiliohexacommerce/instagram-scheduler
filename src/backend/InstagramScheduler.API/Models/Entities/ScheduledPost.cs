namespace InstagramScheduler.API.Models.Entities;

public enum PostStatus { Draft, Scheduled, Published, Failed }
public enum PostType { Image, Carousel, Reel }

public class ScheduledPost
{
    public int Id { get; set; }
    public int AccountId { get; set; }
    public InstagramAccount Account { get; set; } = null!;
    public string Caption { get; set; } = string.Empty;
    public string? Hashtags { get; set; }
    public List<string> MediaUrls { get; set; } = new();
    public PostType Type { get; set; } = PostType.Image;
    public PostStatus Status { get; set; } = PostStatus.Draft;
    public DateTime? ScheduledAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public string? InstagramPostId { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
