namespace InstagramScheduler.API.DTOs;

public record InboxReplyDto(
    string Id,
    string AuthorUsername,
    string Text,
    DateTime Timestamp
);

public record InboxCommentDto(
    string Id,
    string AuthorUsername,
    string Text,
    DateTime Timestamp,
    List<InboxReplyDto> Replies
);

public record InboxPostDto(
    string PostId,
    string Platform,
    int AccountId,
    string AccountUsername,
    string? AccountPictureUrl,
    string Caption,
    string? MediaUrl,
    DateTime PostedAt,
    int CommentsCount,
    List<InboxCommentDto> Comments
);

public record ReplyRequest(string CommentId, string Platform, int AccountId, string Message);
