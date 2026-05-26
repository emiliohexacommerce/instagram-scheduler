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
    public PostsController(IPostService posts) => _posts = posts;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<PostResponse>>> GetAll() =>
        Ok(await _posts.GetPostsByUserAsync(UserId));

    [HttpGet("account/{accountId}")]
    public async Task<ActionResult<List<PostResponse>>> GetByAccount(int accountId) =>
        Ok(await _posts.GetPostsByAccountAsync(accountId, UserId));

    [HttpPost]
    public async Task<ActionResult<PostResponse>> Create(CreatePostRequest request) =>
        Ok(await _posts.CreatePostAsync(request, UserId));

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
