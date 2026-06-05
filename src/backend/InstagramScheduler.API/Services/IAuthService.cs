using InstagramScheduler.API.DTOs;

namespace InstagramScheduler.API.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> RefreshAsync(string refreshToken);
    string GenerateToken(int userId, string email);
}
