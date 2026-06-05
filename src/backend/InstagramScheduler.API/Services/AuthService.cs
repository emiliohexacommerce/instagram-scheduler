using InstagramScheduler.API.Data;
using InstagramScheduler.API.DTOs;
using InstagramScheduler.API.Models.Entities;
using InstagramScheduler.API.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace InstagramScheduler.API.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly JwtOptions _jwt;

    public AuthService(AppDbContext db, IOptions<JwtOptions> jwt)
    {
        _db = db;
        _jwt = jwt.Value;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            throw new InvalidOperationException("El email ya está registrado.");

        var planId = await _db.Plans.AnyAsync(p => p.Id == request.PlanId && p.IsActive)
            ? request.PlanId
            : 1; // fallback al plan Pro

        var user = new User
        {
            Name = request.Name,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        // Trial de 30 días al plan seleccionado
        _db.Subscriptions.Add(new Subscription
        {
            UserId = user.Id,
            PlanId = planId,
            Status = SubscriptionStatus.Trial,
            IsTrial = true,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(30)
        });
        await _db.SaveChangesAsync();

        return await IssueTokensAsync(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email)
            ?? throw new UnauthorizedAccessException("Credenciales inválidas.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Credenciales inválidas.");

        return await IssueTokensAsync(user);
    }

    public async Task<AuthResponse> RefreshAsync(string refreshToken)
    {
        var stored = await _db.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Token == refreshToken)
            ?? throw new UnauthorizedAccessException("Refresh token inválido.");

        if (stored.IsRevoked)
            throw new UnauthorizedAccessException("Refresh token revocado.");

        if (stored.ExpiresAt < DateTime.UtcNow)
            throw new UnauthorizedAccessException("Refresh token expirado.");

        // Revoke old token (rotation)
        stored.IsRevoked = true;

        var newJwt = GenerateToken(stored.UserId, stored.User.Email);
        var newRefresh = await SaveRefreshTokenAsync(stored.UserId);
        stored.ReplacedByToken = newRefresh.Token;

        await _db.SaveChangesAsync();

        return new AuthResponse(newJwt, stored.User.Name, stored.User.Email, newRefresh.Token);
    }

    public string GenerateToken(int userId, string email)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            claims: [
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Email, email)
            ],
            expires: DateTime.UtcNow.AddHours(_jwt.ExpiryHours),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<AuthResponse> IssueTokensAsync(User user)
    {
        var jwt = GenerateToken(user.Id, user.Email);
        var refresh = await SaveRefreshTokenAsync(user.Id);
        await _db.SaveChangesAsync();
        return new AuthResponse(jwt, user.Name, user.Email, refresh.Token);
    }

    private async Task<RefreshToken> SaveRefreshTokenAsync(int userId)
    {
        // Revoke previous active refresh tokens for this user
        var active = await _db.RefreshTokens
            .Where(r => r.UserId == userId && !r.IsRevoked && r.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();
        active.ForEach(r => r.IsRevoked = true);

        var refresh = new RefreshToken
        {
            UserId = userId,
            Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
            ExpiresAt = DateTime.UtcNow.AddDays(_jwt.RefreshExpiryDays)
        };
        _db.RefreshTokens.Add(refresh);
        return refresh;
    }
}
