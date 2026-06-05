using InstagramScheduler.API.DTOs;
using InstagramScheduler.API.Models.Entities;

namespace InstagramScheduler.API.Services;

public interface IPlanService
{
    Task<List<PlanResponse>> GetActivePlansAsync();
    Task<Plan?> GetByIdAsync(int planId);
}
