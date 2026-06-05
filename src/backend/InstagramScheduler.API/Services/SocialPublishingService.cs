using InstagramScheduler.API.Data;
using InstagramScheduler.API.Models.Entities;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;

namespace InstagramScheduler.API.Services;

public class SocialPublishingService
{
    private readonly AppDbContext _db;
    private readonly PublisherFactory _factory;
    private readonly ILogger<SocialPublishingService> _logger;
    private readonly IDataProtector _protector;

    public SocialPublishingService(
        AppDbContext db,
        PublisherFactory factory,
        ILogger<SocialPublishingService> logger,
        IDataProtectionProvider dataProtection)
    {
        _db = db;
        _factory = factory;
        _logger = logger;
        _protector = dataProtection.CreateProtector("InstagramScheduler.AccessTokens");
    }

    public async Task PublishPostAsync(int postId, CancellationToken ct = default)
    {
        var post = await _db.ScheduledPosts
            .Include(p => p.Attempts)
            .FirstOrDefaultAsync(p => p.Id == postId, ct)
            ?? throw new KeyNotFoundException($"Post {postId} no encontrado.");

        if (post.Status is PostStatus.Processing or PostStatus.Published)
        {
            _logger.LogWarning("Post {PostId} already in status {Status}, skipping.", postId, post.Status);
            return;
        }

        post.Status = PostStatus.Processing;
        post.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        var attemptNumber = post.Attempts.Count + 1;
        var newResults = new List<PostResult>();
        var anyFailure = false;
        Exception? lastTransient = null;

        foreach (var platform in post.Platforms)
        {
            var account = await _db.SocialAccounts.FirstOrDefaultAsync(a =>
                a.UserId == post.UserId && a.Platform == platform && a.IsActive, ct);

            if (account == null)
            {
                _logger.LogWarning("No active {Platform} account found for user {UserId}.", platform, post.UserId);
                newResults.Add(new PostResult
                {
                    Platform = platform,
                    Status = PostStatus.Failed,
                    ErrorMessage = $"No hay cuenta activa de {platform} conectada."
                });
                anyFailure = true;
                continue;
            }

            try
            {
                var publisher = _factory.GetPublisher(platform);
                var result = await publisher.PublishAsync(post, account, ct);

                newResults.Add(new PostResult
                {
                    Platform = platform,
                    Status = result.Success ? PostStatus.Published : PostStatus.Failed,
                    PlatformPostId = result.PlatformPostId,
                    ErrorMessage = result.ErrorMessage,
                    PublishedAt = result.Success ? DateTime.UtcNow : null
                });

                if (!result.Success) anyFailure = true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error publishing post {PostId} to {Platform} (attempt {Attempt}).", postId, platform, attemptNumber);

                newResults.Add(new PostResult
                {
                    Platform = platform,
                    Status = PostStatus.Failed,
                    ErrorMessage = ex.Message
                });
                anyFailure = true;

                if (IsTransientError(ex))
                    lastTransient = ex;
            }
        }

        post.Results = newResults;
        post.UpdatedAt = DateTime.UtcNow;

        _db.PublicationAttempts.Add(new PublicationAttempt
        {
            ScheduledPostId = postId,
            Success = !anyFailure,
            ErrorMessage = anyFailure ? string.Join("; ", newResults.Where(r => r.ErrorMessage != null).Select(r => $"{r.Platform}: {r.ErrorMessage}")) : null,
            AttemptNumber = attemptNumber
        });

        if (lastTransient != null && anyFailure)
        {
            post.Status = PostStatus.Scheduled;
            await _db.SaveChangesAsync(ct);
            throw lastTransient;
        }

        post.Status = anyFailure ? PostStatus.Failed : PostStatus.Published;
        await _db.SaveChangesAsync(ct);
    }

    private static bool IsTransientError(Exception ex) =>
        ex is HttpRequestException ||
        ex is TaskCanceledException ||
        ex is TimeoutException ||
        ex.Message.Contains("rate limit", StringComparison.OrdinalIgnoreCase) ||
        ex.Message.Contains("timeout", StringComparison.OrdinalIgnoreCase);
}
