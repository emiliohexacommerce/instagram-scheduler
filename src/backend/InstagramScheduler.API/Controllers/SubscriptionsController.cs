using InstagramScheduler.API.Data;
using InstagramScheduler.API.DTOs;
using InstagramScheduler.API.Models.Entities;
using InstagramScheduler.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace InstagramScheduler.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SubscriptionsController : ControllerBase
{
    private readonly ISubscriptionService _subscriptions;
    private readonly IPlanService _plans;
    private readonly IWebpayService _webpay;
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public SubscriptionsController(
        ISubscriptionService subscriptions,
        IPlanService plans,
        IWebpayService webpay,
        AppDbContext db,
        IConfiguration config)
    {
        _subscriptions = subscriptions;
        _plans = plans;
        _webpay = webpay;
        _db = db;
        _config = config;
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("me")]
    public async Task<ActionResult<SubscriptionResponse>> GetMine()
    {
        var sub = await _subscriptions.GetActiveSubscriptionResponseAsync(UserId);
        if (sub == null) return NotFound(new { message = "Sin suscripción activa." });
        return Ok(sub);
    }

    [HttpPost("checkout")]
    public async Task<ActionResult<CheckoutResponse>> Checkout([FromBody] CheckoutRequest request)
    {
        var plan = await _plans.GetByIdAsync(request.PlanId)
            ?? throw new KeyNotFoundException("Plan no encontrado.");

        var orderId = $"SUB-{UserId}-{DateTime.UtcNow:yyyyMMddHHmmss}";
        var result = await _webpay.CreateTransactionAsync(orderId, plan.PriceMonthly);

        var payment = new Payment
        {
            SubscriptionId = await GetOrCreatePendingSubscriptionIdAsync(UserId, request.PlanId),
            Amount = plan.PriceMonthly,
            Status = PaymentStatus.Pending,
            TransbankToken = result.Token,
            TransbankOrderId = orderId
        };
        _db.Payments.Add(payment);
        await _db.SaveChangesAsync();

        return Ok(new CheckoutResponse(result.Url + "?token_ws=" + result.Token, result.Token, orderId));
    }

    [HttpGet("webpay/return")]
    [AllowAnonymous]
    public async Task<IActionResult> WebpayReturn([FromQuery] string token_ws)
    {
        var frontendUrl = _config["FRONTEND_URL"] ?? "http://localhost:5173";

        var payment = await _db.Payments
            .Include(p => p.Subscription)
            .FirstOrDefaultAsync(p => p.TransbankToken == token_ws);

        if (payment == null)
            return Redirect($"{frontendUrl}/subscription?payment=error");

        var result = await _webpay.ConfirmTransactionAsync(token_ws);

        if (result.Success)
        {
            payment.Status = PaymentStatus.Completed;
            payment.TransbankAuthCode = result.AuthCode;
            payment.TransbankCardNumber = result.CardNumber;
            payment.PaidAt = DateTime.UtcNow;

            await _subscriptions.ActivateAfterPaymentAsync(
                payment.SubscriptionId,
                payment.Subscription.PlanId,
                DateTime.UtcNow.AddMonths(1));

            await _db.SaveChangesAsync();
            return Redirect($"{frontendUrl}/subscription?payment=success");
        }

        payment.Status = PaymentStatus.Failed;
        await _db.SaveChangesAsync();
        return Redirect($"{frontendUrl}/subscription?payment=failed");
    }

    private async Task<int> GetOrCreatePendingSubscriptionIdAsync(int userId, int planId)
    {
        var sub = await _subscriptions.GetActiveSubscriptionAsync(userId);
        if (sub != null) return sub.Id;

        var newSub = new Subscription
        {
            UserId = userId,
            PlanId = planId,
            Status = SubscriptionStatus.PendingPayment,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddMonths(1)
        };
        _db.Subscriptions.Add(newSub);
        await _db.SaveChangesAsync();
        return newSub.Id;
    }
}
