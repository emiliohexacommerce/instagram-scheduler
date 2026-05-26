namespace InstagramScheduler.API.Services;

public interface IInstagramService
{
    Task PublishPostAsync(int postId);
    Task<string> GetAuthUrlAsync(int userId);
    Task HandleCallbackAsync(string code, int userId);
}
