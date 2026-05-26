using InstagramScheduler.API.Data;
using InstagramScheduler.API.DTOs;
using InstagramScheduler.API.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Hangfire;

namespace InstagramScheduler.API.Services;

public class PostService : IPostService
{
    private readonly AppDbContext _db;
    private readonly IInstagramService _instagram;

    public PostService(AppDbContext db, IInstagramService instagram)
    {
        _db = db;
        _instagram = instagram;
    }

    public async Task<List<PostResponse>> GetPostsByUserAsync(int userId)
    {
        return await _db.ScheduledPosts
            .Include(p => p.Account)
            .Where(p => p.Account.UserId == userId)
            .OrderByDescending(p => p.ScheduledAt ?? p.CreatedAt)
            .Select(p => MapToResponse(p))
            .ToListAsync();
    }

    public async Task<List<PostResponse>> GetPostsByAccountAsync(int accountId, int userId)
    {
        return await _db.ScheduledPosts
            .Include(p => p.Account)
            .Where(p => p.AccountId == accountId && p.Account.UserId == userId)
            .OrderByDescending(p => p.ScheduledAt ?? p.CreatedAt)
            .Select(p => MapToResponse(p))
            .ToListAsync();
    }

    public async Task<PostResponse> CreatePostAsync(CreatePostRequest request, int userId)
    {
        var account = await _db.InstagramAccounts
            .FirstOrDefaultAsync(a => a.Id == request.AccountId && a.UserId == userId)
            ?? throw new UnauthorizedAccessException("Cuenta no encontrada.");

        var post = new ScheduledPost
        {
            AccountId = request.AccountId,
            Caption = request.Caption,
            Hashtags = request.Hashtags,
            MediaUrls = request.MediaUrls,
            Type = request.Type,
            ScheduledAt = request.ScheduledAt,
            Status = request.ScheduledAt.HasValue ? PostStatus.Scheduled : PostStatus.Draft
        };

        _db.ScheduledPosts.Add(post);
        await _db.SaveChangesAsync();

        // Programar publicación con Hangfire
        if (post.ScheduledAt.HasValue)
        {
            var delay = post.ScheduledAt.Value - DateTime.UtcNow;
            if (delay > TimeSpan.Zero)
                BackgroundJob.Schedule<IInstagramService>(
                    s => s.PublishPostAsync(post.Id), delay);
        }

        return MapToResponse(post);
    }

    public async Task<PostResponse> UpdatePostAsync(int postId, UpdatePostRequest request, int userId)
    {
        var post = await _db.ScheduledPosts
            .Include(p => p.Account)
            .FirstOrDefaultAsync(p => p.Id == postId && p.Account.UserId == userId)
            ?? throw new KeyNotFoundException("Post no encontrado.");

        if (request.Caption != null) post.Caption = request.Caption;
        if (request.Hashtags != null) post.Hashtags = request.Hashtags;
        if (request.MediaUrls != null) post.MediaUrls = request.MediaUrls;
        if (request.ScheduledAt.HasValue) post.ScheduledAt = request.ScheduledAt;
        if (request.Status.HasValue) post.Status = request.Status.Value;
        post.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return MapToResponse(post);
    }

    public async Task DeletePostAsync(int postId, int userId)
    {
        var post = await _db.ScheduledPosts
            .Include(p => p.Account)
            .FirstOrDefaultAsync(p => p.Id == postId && p.Account.UserId == userId)
            ?? throw new KeyNotFoundException("Post no encontrado.");

        _db.ScheduledPosts.Remove(post);
        await _db.SaveChangesAsync();
    }

    public async Task<PostResponse> PublishNowAsync(int postId, int userId)
    {
        var post = await _db.ScheduledPosts
            .Include(p => p.Account)
            .FirstOrDefaultAsync(p => p.Id == postId && p.Account.UserId == userId)
            ?? throw new KeyNotFoundException("Post no encontrado.");

        await _instagram.PublishPostAsync(post.Id);

        await _db.Entry(post).ReloadAsync();
        return MapToResponse(post);
    }

    private static PostResponse MapToResponse(ScheduledPost p) => new(
        p.Id, p.AccountId, p.Account?.Username ?? "",
        p.Caption, p.Hashtags, p.MediaUrls,
        p.Type, p.Status, p.ScheduledAt, p.PublishedAt, p.CreatedAt
    );
}
