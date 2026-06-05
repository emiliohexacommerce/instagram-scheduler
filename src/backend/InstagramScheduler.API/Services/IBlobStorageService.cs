namespace InstagramScheduler.API.Services;

public interface IBlobStorageService
{
    Task<string> UploadAsync(Stream content, string fileName, string contentType, CancellationToken ct = default);
    string GetSasUrl(string blobName, TimeSpan expiry);
    Task DeleteAsync(string blobName, CancellationToken ct = default);
}
