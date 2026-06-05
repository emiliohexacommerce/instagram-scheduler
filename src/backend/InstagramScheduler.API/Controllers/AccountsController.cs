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
    private readonly PublisherFactory _factory;
    private readonly ISubscriptionService _subscriptions;
    private readonly IConfiguration _config;

    public AccountsController(IAccountService accounts, PublisherFactory factory, ISubscriptionService subscriptions, IConfiguration config)
    {
        _accounts = accounts;
        _factory = factory;
        _subscriptions = subscriptions;
        _config = config;
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<SocialAccountResponse>>> GetAll(
        [FromQuery] SocialPlatform? platform = null)
    {
        var accounts = platform.HasValue
            ? await _accounts.GetAccountsByUserAndPlatformAsync(UserId, platform.Value)
            : await _accounts.GetAccountsByUserAsync(UserId);

        return Ok(accounts.Select(MapToResponse));
    }

    [HttpGet("platforms")]
    public ActionResult<List<string>> GetSupportedPlatforms() =>
        Ok(_factory.SupportedPlatforms.Select(p => p.ToString()));

    [HttpGet("connect/{platform}")]
    public async Task<ActionResult<object>> Connect(SocialPlatform platform)
    {
        if (!await _subscriptions.CanAddAccountAsync(UserId))
            throw new InvalidOperationException("Has alcanzado el límite de cuentas de tu plan. Actualiza tu suscripción para agregar más.");

        var publisher = _factory.GetPublisher(platform);
        return Ok(new { url = await publisher.GetAuthUrlAsync(UserId) });
    }

    [HttpGet("callback")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback([FromQuery] string code, [FromQuery] string state)
    {
        var parts = state.Split(':');
        if (parts.Length < 2 || !int.TryParse(parts[1], out var platformInt))
            return BadRequest("Estado inválido.");

        var platform = (SocialPlatform)platformInt;
        var publisher = _factory.GetPublisher(platform);
        await publisher.HandleCallbackAsync(code, state);

        var frontendUrl = _config["FRONTEND_URL"] ?? "http://localhost:5173";
        return Redirect($"{frontendUrl}/accounts?connected=true&platform={platform}");
    }

    [HttpPost("facebook-pages")]
    public async Task<ActionResult<List<FacebookPageOption>>> GetFacebookPages([FromBody] GetFacebookPagesRequest request)
    {
        var publisher = _factory.GetPublisher(SocialPlatform.Facebook) as FacebookPublisher
            ?? throw new NotSupportedException("FacebookPublisher no registrado.");
        var pages = await publisher.GetAvailablePagesAsync(request.AccessToken);
        return Ok(pages);
    }

    [HttpPost("connect-token")]
    public async Task<ActionResult<SocialAccountResponse>> ConnectWithToken([FromBody] ConnectTokenRequest request)
    {
        if (!await _subscriptions.CanAddAccountAsync(UserId))
            throw new InvalidOperationException("Has alcanzado el límite de cuentas de tu plan. Actualiza tu suscripción para agregar más.");

        SocialAccount account = request.Platform switch
        {
            SocialPlatform.Instagram => await (_factory.GetPublisher(SocialPlatform.Instagram) as InstagramPublisher
                ?? throw new NotSupportedException("InstagramPublisher no registrado."))
                .ConnectWithTokenAsync(request.AccessToken, UserId),
            SocialPlatform.Facebook => await (_factory.GetPublisher(SocialPlatform.Facebook) as FacebookPublisher
                ?? throw new NotSupportedException("FacebookPublisher no registrado."))
                .ConnectWithTokenAsync(request.AccessToken, UserId),
            _ => throw new NotSupportedException($"Plataforma {request.Platform} no soportada para conexión por token.")
        };

        return Ok(MapToResponse(account));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Disconnect(int id)
    {
        await _accounts.DisconnectAccountAsync(id, UserId);
        return NoContent();
    }

    private static SocialAccountResponse MapToResponse(SocialAccount a) => new(
        a.Id, a.Platform, a.PlatformUserId, a.Username, a.Name,
        a.ProfilePictureUrl, a.TokenExpiresAt, a.IsActive, a.ConnectedAt);
}
