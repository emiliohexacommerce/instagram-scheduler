using InstagramScheduler.API.DTOs;
using InstagramScheduler.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace InstagramScheduler.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlansController : ControllerBase
{
    private readonly IPlanService _plans;
    public PlansController(IPlanService plans) => _plans = plans;

    [HttpGet]
    public async Task<ActionResult<List<PlanResponse>>> GetAll() =>
        Ok(await _plans.GetActivePlansAsync());
}
