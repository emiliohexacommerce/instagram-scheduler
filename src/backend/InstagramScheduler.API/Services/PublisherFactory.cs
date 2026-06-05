using InstagramScheduler.API.Models.Entities;

namespace InstagramScheduler.API.Services;

public class PublisherFactory
{
    private readonly Dictionary<SocialPlatform, ISocialPublisher> _publishers;

    public PublisherFactory(IEnumerable<ISocialPublisher> publishers)
    {
        _publishers = publishers.ToDictionary(p => p.Platform);
    }

    public ISocialPublisher GetPublisher(SocialPlatform platform)
    {
        if (_publishers.TryGetValue(platform, out var publisher))
            return publisher;
        throw new NotSupportedException($"No publisher registered for platform {platform}.");
    }

    public IReadOnlyCollection<SocialPlatform> SupportedPlatforms => _publishers.Keys;
}
