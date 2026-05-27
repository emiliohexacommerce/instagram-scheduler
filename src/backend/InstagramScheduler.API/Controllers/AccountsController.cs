using InstagramScheduler.API.DTOs;
using InstagramScheduler.API.Models.Entities;
using InstagramScheduler.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace InstagramScheduler.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AccountsController : ControllerBase
{
    private readonly IAccountService _accounts;
    private readonly IInstagramService _instagram;
    private readonly IConfiguration _config;
    public AccountsController(IAccountService accounts, IInstagramService instagram, IConfiguration config)
    {
        _accounts = accounts;
        _instagram = instagram;
        _config = config;
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<InstagramAccount>>> GetAll() =>
        Ok(await _accounts.GetAccountsByUserAsync(UserId));

    [HttpGet("connect")]
    public async Task<ActionResult<object>> Connect() =>
        Ok(new { url = await _instagram.GetAuthUrlAsync(UserId) });

    [HttpGet("callback")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback([FromQuery] string code, [FromQuery] int state)
    {
        await _instagram.HandleCallbackAsync(code, state);
        var frontendUrl = _config["FRONTEND_URL"] ?? "http://localhost:4200";
        return Redirect($"{frontendUrl}/accounts?connected=true");
    }

    [HttpPost("connect-token")]
    public async Task<IActionResult> ConnectWithToken([FromBody] ConnectTokenRequest request)
    {
        await _instagram.ConnectWithTokenAsync(request.AccessToken, UserId);
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Disconnect(int id)
    {
        await _accounts.DisconnectAccountAsync(id, UserId);
        return NoContent();
    }
}
