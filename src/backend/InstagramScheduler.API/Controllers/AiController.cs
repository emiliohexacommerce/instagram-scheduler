using InstagramScheduler.API.DTOs;
using InstagramScheduler.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InstagramScheduler.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AiController : ControllerBase
{
    private readonly IAiCaptionService _ai;
    public AiController(IAiCaptionService ai) => _ai = ai;

    [HttpPost("caption")]
    public async Task<ActionResult<string>> GenerateCaption(GenerateCaptionRequest request) =>
        Ok(await _ai.GenerateCaptionAsync(request));
}
