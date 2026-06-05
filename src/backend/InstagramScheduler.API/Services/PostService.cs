using InstagramScheduler.API.Data;
using InstagramScheduler.API.DTOs;
using InstagramScheduler.API.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Hangfire;

namespace InstagramScheduler.API.Services;

public class PostService : IPostService
{
    private readonly AppDbContext _db;
    private readonly SocialPublishingService _publishing;

    public PostService(AppDbContext db, SocialPublishingService publishing)
    {
        _db = db;
        _publishing = publishing;
    }

    public async Task<List<PostResponse>> GetPostsByUserAsync(int userId)
    {
        return await _db.ScheduledPosts
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.ScheduledAt ?? p.CreatedAt)
            .Select(p => MapToResponse(p))
            .ToListAsync();
    }

    public async Task<PostResponse> CreatePostAsync(CreatePostRequest request, int userId)
    {
        var scheduledAt = request.ScheduledAt.HasValue
            ? DateTime.SpecifyKind(request.ScheduledAt.Value, DateTimeKind.Utc)
            : (DateTime?)null;

        var post = new ScheduledPost
        {
            UserId = userId,
            Caption = request.Caption,
            Hashtags = request.Hashtags,
            MediaUrls = request.MediaUrls,
            Type = request.Type,
            Platforms = request.Platforms,
            ScheduledAt = scheduledAt,
            Status = scheduledAt.HasValue ? PostStatus.Scheduled : PostStatus.Draft
        };

        _db.ScheduledPosts.Add(post);
        await _db.SaveChangesAsync();

        if (post.ScheduledAt.HasValue)
        {
            var delay = post.ScheduledAt.Value - DateTime.UtcNow;
            if (delay > TimeSpan.Zero)
                BackgroundJob.Schedule<SocialPublishingService>(
                    s => s.PublishPostAsync(post.Id, CancellationToken.None), delay);
        }

        return MapToResponse(post);
    }

    public async Task<PostResponse> UpdatePostAsync(int postId, UpdatePostRequest request, int userId)
    {
        var post = await _db.ScheduledPosts
            .FirstOrDefaultAsync(p => p.Id == postId && p.UserId == userId)
            ?? throw new KeyNotFoundException("Post no encontrado.");

        if (request.Caption != null) post.Caption = request.Caption;
        if (request.Hashtags != null) post.Hashtags = request.Hashtags;
        if (request.MediaUrls != null) post.MediaUrls = request.MediaUrls;
        if (request.Platforms != null) post.Platforms = request.Platforms;
        if (request.ScheduledAt.HasValue)
            post.ScheduledAt = DateTime.SpecifyKind(request.ScheduledAt.Value, DateTimeKind.Utc);
        if (request.Status.HasValue) post.Status = request.Status.Value;
        post.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return MapToResponse(post);
    }

    public async Task DeletePostAsync(int postId, int userId)
    {
        var post = await _db.ScheduledPosts
            .FirstOrDefaultAsync(p => p.Id == postId && p.UserId == userId)
            ?? throw new KeyNotFoundException("Post no encontrado.");

        _db.ScheduledPosts.Remove(post);
        await _db.SaveChangesAsync();
    }

    public async Task<PostResponse> PublishNowAsync(int postId, int userId)
    {
        var post = await _db.ScheduledPosts
            .FirstOrDefaultAsync(p => p.Id == postId && p.UserId == userId)
            ?? throw new KeyNotFoundException("Post no encontrado.");

        await _publishing.PublishPostAsync(post.Id);

        await _db.Entry(post).ReloadAsync();
        return MapToResponse(post);
    }

    private static PostResponse MapToResponse(ScheduledPost p) => new(
        p.Id,
        p.UserId,
        p.Caption,
        p.Hashtags,
        p.MediaUrls,
        p.Type,
        p.Status,
        p.Platforms,
        p.Results.Select(r => new PostResultResponse(r.Platform, r.Status, r.PlatformPostId, r.ErrorMessage, r.PublishedAt)).ToList(),
        p.ScheduledAt,
        p.CreatedAt
    );
}
