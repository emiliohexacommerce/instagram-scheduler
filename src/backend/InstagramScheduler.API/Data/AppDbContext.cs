using InstagramScheduler.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace InstagramScheduler.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<InstagramAccount> InstagramAccounts => Set<InstagramAccount>();
    public DbSet<ScheduledPost> ScheduledPosts => Set<ScheduledPost>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<InstagramAccount>(e =>
        {
            e.HasOne(a => a.User).WithMany(u => u.Accounts).HasForeignKey(a => a.UserId);
        });

        modelBuilder.Entity<ScheduledPost>(e =>
        {
            e.HasOne(p => p.Account).WithMany(a => a.Posts).HasForeignKey(p => p.AccountId);
            e.Property(p => p.MediaUrls).HasColumnType("jsonb");
        });
    }
}
