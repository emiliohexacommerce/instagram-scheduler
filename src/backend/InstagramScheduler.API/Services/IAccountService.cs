using InstagramScheduler.API.Models.Entities;

namespace InstagramScheduler.API.Services;

public interface IAccountService
{
    Task<List<InstagramAccount>> GetAccountsByUserAsync(int userId);
    Task DisconnectAccountAsync(int accountId, int userId);
}
