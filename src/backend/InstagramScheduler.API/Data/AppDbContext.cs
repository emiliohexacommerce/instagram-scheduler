using InstagramScheduler.API.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using System.Text.Json;

namespace InstagramScheduler.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<SocialAccount> SocialAccounts => Set<SocialAccount>();
    public DbSet<ScheduledPost> ScheduledPosts => Set<ScheduledPost>();
    public DbSet<PostMediaFile> PostMediaFiles => Set<PostMediaFile>();
    public DbSet<PublicationAttempt> PublicationAttempts => Set<PublicationAttempt>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Plan> Plans => Set<Plan>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<Payment> Payments => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.HasMany(u => u.SocialAccounts).WithOne(a => a.User).HasForeignKey(a => a.UserId);
            e.HasMany(u => u.RefreshTokens).WithOne(r => r.User).HasForeignKey(r => r.UserId);
        });

        modelBuilder.Entity<SocialAccount>(e =>
        {
            e.HasIndex(a => new { a.UserId, a.Platform, a.IsActive });
            e.HasIndex(a => a.TokenExpiresAt);
            e.Property(a => a.AccessToken).HasColumnType("nvarchar(max)");
            e.Property(a => a.Platform).HasConversion<int>();
        });

        modelBuilder.Entity<ScheduledPost>(e =>
        {
            e.HasOne(p => p.User).WithMany().HasForeignKey(p => p.UserId);
            e.HasMany(p => p.MediaFiles).WithOne(f => f.ScheduledPost).HasForeignKey(f => f.ScheduledPostId);
            e.HasMany(p => p.Attempts).WithOne(a => a.ScheduledPost).HasForeignKey(a => a.ScheduledPostId);
            e.HasIndex(p => new { p.UserId, p.Status });
            e.HasIndex(p => p.ScheduledAt);

            e.Property(p => p.MediaUrls)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>(),
                    new ValueComparer<List<string>>(
                        (a, b) => a!.SequenceEqual(b!),
                        c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                        c => c.ToList()))
                .HasColumnType("nvarchar(max)");

            e.Property(p => p.Platforms)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<SocialPlatform>>(v, (JsonSerializerOptions?)null) ?? new List<SocialPlatform>(),
                    new ValueComparer<List<SocialPlatform>>(
                        (a, b) => a!.SequenceEqual(b!),
                        c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                        c => c.ToList()))
                .HasColumnType("nvarchar(max)");

            e.Property(p => p.Results)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<PostResult>>(v, (JsonSerializerOptions?)null) ?? new List<PostResult>(),
                    new ValueComparer<List<PostResult>>(
                        (a, b) => JsonSerializer.Serialize(a, (JsonSerializerOptions?)null) == JsonSerializer.Serialize(b, (JsonSerializerOptions?)null),
                        c => JsonSerializer.Serialize(c, (JsonSerializerOptions?)null).GetHashCode(),
                        c => JsonSerializer.Deserialize<List<PostResult>>(JsonSerializer.Serialize(c, (JsonSerializerOptions?)null), (JsonSerializerOptions?)null)!))
                .HasColumnType("nvarchar(max)");
        });

        modelBuilder.Entity<PostMediaFile>(e =>
        {
            e.HasIndex(f => new { f.ScheduledPostId, f.IsDeleted });
            e.HasIndex(f => f.BlobName).IsUnique();
        });

        modelBuilder.Entity<PublicationAttempt>(e =>
        {
            e.HasIndex(a => new { a.ScheduledPostId, a.AttemptedAt });
        });

        modelBuilder.Entity<RefreshToken>(e =>
        {
            e.HasIndex(r => r.Token).IsUnique();
            e.HasIndex(r => new { r.UserId, r.IsRevoked });
        });

        modelBuilder.Entity<Plan>(e =>
        {
            e.Property(p => p.PriceMonthly).HasColumnType("decimal(10,2)");
            e.HasData(
                new Plan { Id = 1, Name = "Pro", Description = "Para creadores y pequeños negocios", PriceMonthly = 9990, MaxAccounts = 3, MaxPostsPerMonth = 60, MaxPostsPerWeek = 15, IsUnlimited = false, IsActive = true, SortOrder = 1 },
                new Plan { Id = 2, Name = "Business", Description = "Para negocios en crecimiento", PriceMonthly = 24990, MaxAccounts = 10, MaxPostsPerMonth = 250, MaxPostsPerWeek = 60, IsUnlimited = false, IsActive = true, SortOrder = 2 },
                new Plan { Id = 3, Name = "Agency", Description = "Para agencias y equipos", PriceMonthly = 49990, MaxAccounts = int.MaxValue, MaxPostsPerMonth = int.MaxValue, MaxPostsPerWeek = int.MaxValue, IsUnlimited = true, IsActive = true, SortOrder = 3 }
            );
        });

        modelBuilder.Entity<Subscription>(e =>
        {
            e.HasOne(s => s.User).WithMany(u => u.Subscriptions).HasForeignKey(s => s.UserId);
            e.HasOne(s => s.Plan).WithMany(p => p.Subscriptions).HasForeignKey(s => s.PlanId);
            e.HasIndex(s => new { s.UserId, s.Status });
            e.Property(s => s.Status).HasConversion<string>();
        });

        modelBuilder.Entity<Payment>(e =>
        {
            e.HasOne(p => p.Subscription).WithMany(s => s.Payments).HasForeignKey(p => p.SubscriptionId);
            e.Property(p => p.Amount).HasColumnType("decimal(10,2)");
            e.Property(p => p.Status).HasConversion<string>();
            e.HasIndex(p => p.TransbankToken);
        });
    }
}
