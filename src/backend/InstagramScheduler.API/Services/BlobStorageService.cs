using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using InstagramScheduler.API.Options;
using Microsoft.Extensions.Options;

namespace InstagramScheduler.API.Services;

public class BlobStorageService : IBlobStorageService
{
    private readonly BlobContainerClient _container;
    private readonly string _containerName;

    public BlobStorageService(IOptions<BlobOptions> opts)
    {
        var o = opts.Value;
        _containerName = o.MediaContainer;
        var serviceClient = new BlobServiceClient(o.ConnectionString);
        _container = serviceClient.GetBlobContainerClient(_containerName);
    }

    public async Task<string> UploadAsync(Stream content, string fileName, string contentType, CancellationToken ct = default)
    {
        await _container.CreateIfNotExistsAsync(PublicAccessType.Blob, cancellationToken: ct);
        var blobName = $"{Guid.NewGuid():N}/{fileName}";
        var blobClient = _container.GetBlobClient(blobName);
        await blobClient.UploadAsync(content, new BlobHttpHeaders { ContentType = contentType }, cancellationToken: ct);
        return blobClient.Uri.ToString();
    }

    public string GetSasUrl(string blobName, TimeSpan expiry)
    {
        var blobClient = _container.GetBlobClient(blobName);
        var sasBuilder = new BlobSasBuilder
        {
            BlobContainerName = _containerName,
            BlobName = blobName,
            Resource = "b",
            ExpiresOn = DateTimeOffset.UtcNow.Add(expiry)
        };
        sasBuilder.SetPermissions(BlobSasPermissions.Read);
        return blobClient.GenerateSasUri(sasBuilder).ToString();
    }

    public async Task DeleteAsync(string blobName, CancellationToken ct = default) =>
        await _container.GetBlobClient(blobName).DeleteIfExistsAsync(cancellationToken: ct);
}
