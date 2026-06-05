using InstagramScheduler.API.DTOs;
using InstagramScheduler.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace InstagramScheduler.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PostsController : ControllerBase
{
    private readonly IPostService _posts;
    private readonly ISubscriptionService _subscriptions;

    public PostsController(IPostService posts, ISubscriptionService subscriptions)
    {
        _posts = posts;
        _subscriptions = subscriptions;
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<PostResponse>>> GetAll() =>
        Ok(await _posts.GetPostsByUserAsync(UserId));

    [HttpPost]
    public async Task<ActionResult<PostResponse>> Create(CreatePostRequest request)
    {
        if (!await _subscriptions.CanPublishPostAsync(UserId))
            throw new InvalidOperationException("Has alcanzado el límite de publicaciones de tu plan. Actualiza tu suscripción para continuar.");
        return Ok(await _posts.CreatePostAsync(request, UserId));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<PostResponse>> Update(int id, UpdatePostRequest request) =>
        Ok(await _posts.UpdatePostAsync(id, request, UserId));

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _posts.DeletePostAsync(id, UserId);
        return NoContent();
    }

    [HttpPost("{id}/publish")]
    public async Task<ActionResult<PostResponse>> PublishNow(int id) =>
        Ok(await _posts.PublishNowAsync(id, UserId));
}
