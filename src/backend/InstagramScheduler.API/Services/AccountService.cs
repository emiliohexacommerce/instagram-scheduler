using InstagramScheduler.API.Data;
using InstagramScheduler.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace InstagramScheduler.API.Services;

public class AccountService : IAccountService
{
    private readonly AppDbContext _db;
    public AccountService(AppDbContext db) => _db = db;

    public Task<List<InstagramAccount>> GetAccountsByUserAsync(int userId) =>
        _db.InstagramAccounts.Where(a => a.UserId == userId && a.IsActive).ToListAsync();

    public async Task DisconnectAccountAsync(int accountId, int userId)
    {
        var account = await _db.InstagramAccounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId)
            ?? throw new KeyNotFoundException("Cuenta no encontrada.");
        account.IsActive = false;
        await _db.SaveChangesAsync();
    }
}
