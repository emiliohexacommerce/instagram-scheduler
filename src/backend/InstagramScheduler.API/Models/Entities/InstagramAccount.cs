namespace InstagramScheduler.API.Models.Entities;

public class InstagramAccount
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string InstagramUserId { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public string AccessToken { get; set; } = string.Empty;
    public DateTime TokenExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime ConnectedAt { get; set; } = DateTime.UtcNow;
    public ICollection<ScheduledPost> Posts { get; set; } = new List<ScheduledPost>();
}
