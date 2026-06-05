using InstagramScheduler.API.Models.Entities;

namespace InstagramScheduler.API.DTOs;

public record SocialAccountResponse(
    int Id,
    SocialPlatform Platform,
    string PlatformUserId,
    string Username,
    string Name,
    string? ProfilePictureUrl,
    DateTime TokenExpiresAt,
    bool IsActive,
    DateTime ConnectedAt
);

public record ConnectTokenRequest(string AccessToken, SocialPlatform Platform);

public record FacebookPageOption(string PageId, string Name, string? PictureUrl, string PageToken);
public record GetFacebookPagesRequest(string AccessToken);
