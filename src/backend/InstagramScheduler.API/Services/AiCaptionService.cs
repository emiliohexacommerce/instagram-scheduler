using InstagramScheduler.API.DTOs;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace InstagramScheduler.API.Services;

public class AiCaptionService : IAiCaptionService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;

    public AiCaptionService(IHttpClientFactory httpFactory, IConfiguration config)
    {
        _http = httpFactory.CreateClient();
        _config = config;
    }

    public async Task<string> GenerateCaptionAsync(GenerateCaptionRequest request)
    {
        var apiKey = _config["ANTHROPIC_API_KEY"]
            ?? throw new InvalidOperationException("ANTHROPIC_API_KEY no configurada.");

        var brand = request.BrandName ?? "nuestra marca";
        var hashtagsInstruction = request.IncludeHashtags
            ? "Incluye al final entre 5 y 10 hashtags relevantes en español e inglés."
            : "No incluyas hashtags.";

        var prompt = $"""
            Eres un experto en marketing digital para Instagram en Latinoamérica.
            Escribe un caption para Instagram sobre: {request.Topic}
            Marca/empresa: {brand}
            Tono: {request.Tone}
            {(request.ExtraContext != null ? $"Contexto adicional: {request.ExtraContext}" : "")}
            {hashtagsInstruction}
            El caption debe ser en español, atractivo, con emojis apropiados y llamar a la acción.
            Responde SOLO con el caption, sin explicaciones adicionales.
            """;

        var body = JsonSerializer.Serialize(new
        {
            model = "claude-sonnet-4-20250514",
            max_tokens = 500,
            messages = new[] { new { role = "user", content = prompt } }
        });

        var req = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages");
        req.Headers.Add("x-api-key", apiKey);
        req.Headers.Add("anthropic-version", "2023-06-01");
        req.Content = new StringContent(body, Encoding.UTF8, "application/json");

        var response = await _http.SendAsync(req);
        var json = JsonSerializer.Deserialize<JsonElement>(await response.Content.ReadAsStringAsync());

        return json.GetProperty("content")[0].GetProperty("text").GetString()
            ?? throw new InvalidOperationException("Error generando caption.");
    }
}
