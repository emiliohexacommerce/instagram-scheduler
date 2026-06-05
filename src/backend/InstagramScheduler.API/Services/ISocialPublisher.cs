using InstagramScheduler.API.Models.Entities;

namespace InstagramScheduler.API.Services;

public record PublishResult(bool Success, string? PlatformPostId, string? ErrorMessage);

public interface ISocialPublisher
{
    SocialPlatform Platform { get; }
    Task<PublishResult> PublishAsync(ScheduledPost post, SocialAccount account, CancellationToken ct = default);
    Task<string> GetAuthUrlAsync(int userId);
    Task<List<SocialAccount>> HandleCallbackAsync(string code, string rawState);
}
