namespace InstagramScheduler.API.Models.Entities;

public class PostMediaFile
{
    public int Id { get; set; }
    public int ScheduledPostId { get; set; }
    public ScheduledPost ScheduledPost { get; set; } = null!;
    public string BlobName { get; set; } = string.Empty;
    public string ContainerName { get; set; } = "media";
    public string ContentType { get; set; } = "image/jpeg";
    public long SizeBytes { get; set; }
    public int Order { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}
