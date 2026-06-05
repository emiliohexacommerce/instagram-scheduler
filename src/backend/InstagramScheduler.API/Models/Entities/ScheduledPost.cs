namespace InstagramScheduler.API.Models.Entities;

public enum PostStatus { Draft, Scheduled, Processing, Published, Failed }
public enum PostType { Image, Carousel, Reel }

public class ScheduledPost
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string Caption { get; set; } = string.Empty;
    public string? Hashtags { get; set; }
    public List<string> MediaUrls { get; set; } = new();
    public PostType Type { get; set; } = PostType.Image;
    public PostStatus Status { get; set; } = PostStatus.Draft;
    public List<SocialPlatform> Platforms { get; set; } = new();
    public List<PostResult> Results { get; set; } = new();
    public DateTime? ScheduledAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<PostMediaFile> MediaFiles { get; set; } = new List<PostMediaFile>();
    public ICollection<PublicationAttempt> Attempts { get; set; } = new List<PublicationAttempt>();
}
