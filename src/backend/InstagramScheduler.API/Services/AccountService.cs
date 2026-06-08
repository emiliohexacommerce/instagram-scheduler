using InstagramScheduler.API.Data;
using InstagramScheduler.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace InstagramScheduler.API.Services;

public class AccountService : IAccountService
{
    private readonly AppDbContext _db;
    public AccountService(AppDbContext db) => _db = db;

    public Task<List<SocialAccount>> GetAccountsByUserAsync(int userId) =>
        _db.SocialAccounts.Where(a => a.UserId == userId && a.IsActive).ToListAsync();

    public Task<List<SocialAccount>> GetAccountsByUserAndPlatformAsync(int userId, SocialPlatform platform) =>
        _db.SocialAccounts.Where(a => a.UserId == userId && a.Platform == platform && a.IsActive).ToListAsync();

    public Task<SocialAccount?> GetAccountByIdAsync(int accountId, int userId) =>
        _db.SocialAccounts.FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId && a.IsActive);

    public async Task DisconnectAccountAsync(int accountId, int userId)
    {
        var account = await _db.SocialAccounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId)
            ?? throw new KeyNotFoundException("Cuenta no encontrada.");
        account.IsActive = false;
        await _db.SaveChangesAsync();
    }
}
