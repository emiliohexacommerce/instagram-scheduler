using InstagramScheduler.API.Options;
using MsOptions = Microsoft.Extensions.Options.IOptions<InstagramScheduler.API.Options.WebpayOptions>;

namespace InstagramScheduler.API.Services;

public class WebpayService : IWebpayService
{
    private readonly WebpayOptions _options;
    private readonly Transbank.Webpay.WebpayPlus.Transaction _tx;
    private readonly ILogger<WebpayService> _logger;

    // Credenciales de integración (pruebas) Transbank Webpay Plus
    private const string TestCommerceCode = "597055555532";
    private const string TestApiKey = "579B532A7440BB0C9079DED94D31EA1615BACK";

    public WebpayService(MsOptions options, ILogger<WebpayService> logger)
    {
        _options = options.Value;
        _logger = logger;

        var commerceCode = _options.IsProduction ? _options.CommerceCode : TestCommerceCode;
        var apiKey = _options.IsProduction ? _options.ApiKey : TestApiKey;
        var integrationType = _options.IsProduction
            ? Transbank.Webpay.Common.WebpayIntegrationType.Live
            : Transbank.Webpay.Common.WebpayIntegrationType.Test;

        _tx = new Transbank.Webpay.WebpayPlus.Transaction(
            new Transbank.Common.Options(commerceCode, apiKey, integrationType));
    }

    public Task<WebpayCreateResult> CreateTransactionAsync(string orderId, decimal amount)
    {
        var response = _tx.Create(
            buyOrder: orderId,
            sessionId: orderId,
            amount: Math.Round(amount, 0),
            returnUrl: _options.ReturnUrl);

        _logger.LogInformation("Transacción Webpay creada. Token: {Token}", response.Token);
        return Task.FromResult(new WebpayCreateResult(response.Token, response.Url));
    }

    public Task<WebpayConfirmResult> ConfirmTransactionAsync(string token)
    {
        var response = _tx.Commit(token);
        var success = response.ResponseCode == 0;

        _logger.LogInformation(
            "Confirmación Webpay. Token: {Token}, ResponseCode: {Code}", token, response.ResponseCode);

        return Task.FromResult(new WebpayConfirmResult(
            success,
            response.AuthorizationCode,
            response.CardDetail?.CardNumber,
            response.Amount ?? 0,
            response.BuyOrder));
    }
}
