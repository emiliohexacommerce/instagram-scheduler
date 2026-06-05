using InstagramScheduler.API.Data;
using InstagramScheduler.API.DTOs;
using InstagramScheduler.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace InstagramScheduler.API.Services;

public class PlanService : IPlanService
{
    private readonly AppDbContext _db;
    public PlanService(AppDbContext db) => _db = db;

    public async Task<List<PlanResponse>> GetActivePlansAsync() =>
        await _db.Plans
            .Where(p => p.IsActive)
            .OrderBy(p => p.SortOrder)
            .Select(p => MapToResponse(p))
            .ToListAsync();

    public Task<Plan?> GetByIdAsync(int planId) =>
        _db.Plans.FirstOrDefaultAsync(p => p.Id == planId && p.IsActive);

    public static PlanResponse MapToResponse(Plan p) => new(
        p.Id, p.Name, p.Description, p.PriceMonthly,
        p.IsUnlimited ? -1 : p.MaxAccounts,
        p.IsUnlimited ? -1 : p.MaxPostsPerMonth,
        p.IsUnlimited ? -1 : p.MaxPostsPerWeek,
        p.IsUnlimited, p.SortOrder);
}
