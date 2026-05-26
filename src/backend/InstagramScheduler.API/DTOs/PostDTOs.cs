using InstagramScheduler.API.Models.Entities;

namespace InstagramScheduler.API.DTOs;

public record CreatePostRequest(
    int AccountId,
    string Caption,
    string? Hashtags,
    List<string> MediaUrls,
    PostType Type,
    DateTime? ScheduledAt
);

public record UpdatePostRequest(
    string? Caption,
    string? Hashtags,
    List<string>? MediaUrls,
    DateTime? ScheduledAt,
    PostStatus? Status
);

public record PostResponse(
    int Id,
    int AccountId,
    string AccountUsername,
    string Caption,
    string? Hashtags,
    List<string> MediaUrls,
    PostType Type,
    PostStatus Status,
    DateTime? ScheduledAt,
    DateTime? PublishedAt,
    DateTime CreatedAt
);

public record GenerateCaptionRequest(
    string Topic,
    string Tone,
    string? BrandName,
    string? ExtraContext,
    bool IncludeHashtags
);
