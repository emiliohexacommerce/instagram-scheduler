namespace InstagramScheduler.API.DTOs;

public record RegisterRequest(string Name, string Email, string Password, int PlanId = 1);
public record LoginRequest(string Email, string Password);
public record AuthResponse(string Token, string Name, string Email, string? RefreshToken = null);
public record RefreshTokenRequest(string RefreshToken);
