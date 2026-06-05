namespace InstagramScheduler.API.Services;

public record WebpayCreateResult(string Token, string Url);
public record WebpayConfirmResult(bool Success, string? AuthCode, string? CardNumber, decimal Amount, string? OrderId);

public interface IWebpayService
{
    Task<WebpayCreateResult> CreateTransactionAsync(string orderId, decimal amount);
    Task<WebpayConfirmResult> ConfirmTransactionAsync(string token);
}
