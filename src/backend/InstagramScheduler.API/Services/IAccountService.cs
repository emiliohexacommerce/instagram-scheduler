using InstagramScheduler.API.Models.Entities;

namespace InstagramScheduler.API.Services;

public interface IAccountService
{
    Task<List<SocialAccount>> GetAccountsByUserAsync(int userId);
    Task<List<SocialAccount>> GetAccountsByUserAndPlatformAsync(int userId, SocialPlatform platform);
    Task<SocialAccount?> GetAccountByIdAsync(int accountId, int userId);
    Task DisconnectAccountAsync(int accountId, int userId);
}
