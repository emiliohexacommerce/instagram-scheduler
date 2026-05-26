using InstagramScheduler.API.DTOs;
using InstagramScheduler.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace InstagramScheduler.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    public AuthController(IAuthService auth) => _auth = auth;

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request) =>
        Ok(await _auth.RegisterAsync(request));

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request) =>
        Ok(await _auth.LoginAsync(request));
}
