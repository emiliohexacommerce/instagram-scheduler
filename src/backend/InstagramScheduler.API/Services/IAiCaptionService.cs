using InstagramScheduler.API.DTOs;

namespace InstagramScheduler.API.Services;

public interface IAiCaptionService
{
    Task<string> GenerateCaptionAsync(GenerateCaptionRequest request);
}
