using InstagramScheduler.API.DTOs;

namespace InstagramScheduler.API.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    string GenerateToken(int userId, string email);
}
