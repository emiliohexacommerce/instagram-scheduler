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
    public AccountsController(IAccountService accounts, IInstagramService instagram)
    {
        _accounts = accounts;
        _instagram = instagram;
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<InstagramAccount>>> GetAll() =>
        Ok(await _accounts.GetAccountsByUserAsync(UserId));

    [HttpGet("connect")]
    public async Task<IActionResult> Connect() =>
        Redirect(await _instagram.GetAuthUrlAsync(UserId));

    [HttpGet("callback")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback([FromQuery] string code, [FromQuery] int state)
    {
        await _instagram.HandleCallbackAsync(code, state);
        return Redirect($"{Request.Scheme}://{Request.Host}/accounts?connected=true");
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Disconnect(int id)
    {
        await _accounts.DisconnectAccountAsync(id, UserId);
        return NoContent();
    }
}
