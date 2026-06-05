using InstagramScheduler.API.Options;
using InstagramScheduler.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace InstagramScheduler.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MediaController : ControllerBase
{
    private readonly IBlobStorageService _blob;
    private readonly BlobOptions _opts;

    public MediaController(IBlobStorageService blob, IOptions<BlobOptions> opts)
    {
        _blob = blob;
        _opts = opts.Value;
    }

    [HttpPost("upload")]
    [RequestSizeLimit(52_428_800)] // 50 MB
    public async Task<ActionResult<UploadResponse>> Upload(IFormFile file, CancellationToken ct)
    {
        if (file.Length == 0) return BadRequest(new { error = "Archivo vacío." });

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp", "video/mp4" };
        if (!allowedTypes.Contains(file.ContentType))
            return BadRequest(new { error = $"Tipo no permitido: {file.ContentType}" });

        await using var stream = file.OpenReadStream();
        var publicUrl = await _blob.UploadAsync(stream, file.FileName, file.ContentType, ct);

        return Ok(new UploadResponse(publicUrl, publicUrl, file.ContentType, file.Length));
    }

    [HttpGet("{*blobName}")]
    public ActionResult<SasResponse> GetSasUrl(string blobName)
    {
        var url = _blob.GetSasUrl(blobName, TimeSpan.FromHours(_opts.SasExpiryHours));
        return Ok(new SasResponse(url, DateTimeOffset.UtcNow.AddHours(_opts.SasExpiryHours)));
    }
}

public record UploadResponse(string BlobName, string Url, string ContentType, long SizeBytes);
public record SasResponse(string Url, DateTimeOffset ExpiresAt);
