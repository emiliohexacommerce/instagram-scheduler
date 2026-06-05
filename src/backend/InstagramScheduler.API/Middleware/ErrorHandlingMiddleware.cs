using System.Net;
using System.Text.Json;

namespace InstagramScheduler.API.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        var (status, message) = ex switch
        {
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, ex.Message),
            KeyNotFoundException => (HttpStatusCode.NotFound, ex.Message),
            InvalidOperationException => (HttpStatusCode.BadRequest, ex.Message),
            ArgumentException => (HttpStatusCode.BadRequest, ex.Message),
            OperationCanceledException => (HttpStatusCode.RequestTimeout, "La operación fue cancelada."),
            _ => (HttpStatusCode.InternalServerError, "Error interno del servidor.")
        };

        if (status == HttpStatusCode.InternalServerError)
            _logger.LogError(ex, "Error no manejado en {Method} {Path}", context.Request.Method, context.Request.Path);
        else
            _logger.LogWarning(ex, "{ExType} en {Method} {Path}", ex.GetType().Name, context.Request.Method, context.Request.Path);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)status;
        await context.Response.WriteAsync(JsonSerializer.Serialize(new
        {
            error = message,
            status = (int)status,
            path = context.Request.Path.Value
        }));
    }
}
