using InstagramScheduler.API.Models.Entities;

namespace InstagramScheduler.API.DTOs;

public record CreatePostRequest(
    string Caption,
    string? Hashtags,
    List<string> MediaUrls,
    PostType Type,
    List<SocialPlatform> Platforms,
    DateTime? ScheduledAt
);

public record UpdatePostRequest(
    string? Caption,
    string? Hashtags,
    List<string>? MediaUrls,
    List<SocialPlatform>? Platforms,
    DateTime? ScheduledAt,
    PostStatus? Status
);

public record PostResultResponse(
    SocialPlatform Platform,
    PostStatus Status,
    string? PlatformPostId,
    string? ErrorMessage,
    DateTime? PublishedAt
);

public record PostResponse(
    int Id,
    int UserId,
    string Caption,
    string? Hashtags,
    List<string> MediaUrls,
    PostType Type,
    PostStatus Status,
    List<SocialPlatform> Platforms,
    List<PostResultResponse> Results,
    DateTime? ScheduledAt,
    DateTime CreatedAt
);

public record GenerateCaptionRequest(
    string Topic,
    string Tone,
    string? BrandName,
    string? ExtraContext,
    bool IncludeHashtags
);
