using InstagramScheduler.API.DTOs;

namespace InstagramScheduler.API.Services;

public interface IPostService
{
    Task<List<PostResponse>> GetPostsByUserAsync(int userId);
    Task<List<PostResponse>> GetPostsByAccountAsync(int accountId, int userId);
    Task<PostResponse> CreatePostAsync(CreatePostRequest request, int userId);
    Task<PostResponse> UpdatePostAsync(int postId, UpdatePostRequest request, int userId);
    Task DeletePostAsync(int postId, int userId);
    Task<PostResponse> PublishNowAsync(int postId, int userId);
}
