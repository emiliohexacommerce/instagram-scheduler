using InstagramScheduler.API.Data;
using InstagramScheduler.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace InstagramScheduler.API.Controllers;

[ApiController]
[Route("api/profile")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly AppDbContext _db;
    public ProfileController(AppDbContext db) => _db = db;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<UserProfileResponse>> Get()
    {
        var user = await _db.Users.FindAsync(UserId)
            ?? throw new KeyNotFoundException("Usuario no encontrado.");
        return Ok(new UserProfileResponse(user.Name, user.Email, user.TimeZone));
    }

    [HttpPut]
    public async Task<ActionResult<UserProfileResponse>> Update([FromBody] UpdateProfileRequest request)
    {
        var user = await _db.Users.FindAsync(UserId)
            ?? throw new KeyNotFoundException("Usuario no encontrado.");

        if (!string.IsNullOrWhiteSpace(request.Name))
            user.Name = request.Name;

        if (!string.IsNullOrWhiteSpace(request.TimeZone))
        {
            try { TimeZoneInfo.FindSystemTimeZoneById(request.TimeZone); }
            catch { return BadRequest("Timezone inválido."); }
            user.TimeZone = request.TimeZone;
        }

        await _db.SaveChangesAsync();
        return Ok(new UserProfileResponse(user.Name, user.Email, user.TimeZone));
    }
}
