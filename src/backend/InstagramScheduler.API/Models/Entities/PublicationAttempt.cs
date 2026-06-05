namespace InstagramScheduler.API.Models.Entities;

public class PublicationAttempt
{
    public int Id { get; set; }
    public int ScheduledPostId { get; set; }
    public ScheduledPost ScheduledPost { get; set; } = null!;
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public string? MetaResponse { get; set; }
    public DateTime AttemptedAt { get; set; } = DateTime.UtcNow;
    public int AttemptNumber { get; set; }
}
