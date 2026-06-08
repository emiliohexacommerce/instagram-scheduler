namespace InstagramScheduler.API.DTOs;

public record AnalyticsOverviewResponse(
    int TotalPosts,
    int PublishedPosts,
    int FailedPosts,
    int ScheduledPosts,
    int DraftPosts,
    double SuccessRate,
    int ThisWeekPosts,
    int ThisMonthPosts,
    List<PlatformStatDto> PlatformBreakdown,
    List<TimelinePointDto> Timeline
);

public record PlatformStatDto(string Platform, int Total, int Published, int Failed);
public record TimelinePointDto(string Date, int Published, int Failed);

public record AccountInsightsResponse(
    int AccountId,
    string Platform,
    string Username,
    string? ProfilePictureUrl,
    long? FollowersCount,
    long? MediaCount
);
