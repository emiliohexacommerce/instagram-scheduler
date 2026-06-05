using InstagramScheduler.API.Data;
using InstagramScheduler.API.Options;
using InstagramScheduler.API.Services;
using InstagramScheduler.API.Middleware;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Hangfire;
using Hangfire.SqlServer;

var builder = WebApplication.CreateBuilder(args);

// Options pattern — bind from config sections, then fall back to flat env vars
builder.Services.Configure<MetaOptions>(builder.Configuration.GetSection("Meta"));
builder.Services.PostConfigure<MetaOptions>(o =>
{
    if (string.IsNullOrEmpty(o.AppId)) o.AppId = builder.Configuration["META_APP_ID"] ?? "";
    if (string.IsNullOrEmpty(o.AppSecret)) o.AppSecret = builder.Configuration["META_APP_SECRET"] ?? "";
    if (string.IsNullOrEmpty(o.RedirectUri)) o.RedirectUri = builder.Configuration["META_REDIRECT_URI"] ?? "";
    if (string.IsNullOrEmpty(o.InstagramAppId)) o.InstagramAppId = builder.Configuration["INSTAGRAM_APP_ID"] ?? "";
    if (string.IsNullOrEmpty(o.InstagramAppSecret)) o.InstagramAppSecret = builder.Configuration["INSTAGRAM_APP_SECRET"] ?? "";
});

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.PostConfigure<JwtOptions>(o =>
{
    if (string.IsNullOrEmpty(o.Secret)) o.Secret = builder.Configuration["JWT_SECRET"] ?? "";
});

builder.Services.Configure<BlobOptions>(builder.Configuration.GetSection("Blob"));

builder.Services.Configure<WebpayOptions>(builder.Configuration.GetSection("Webpay"));
builder.Services.PostConfigure<WebpayOptions>(o =>
{
    if (string.IsNullOrEmpty(o.ReturnUrl))
        o.ReturnUrl = builder.Configuration["WEBPAY_RETURN_URL"] ?? "http://localhost:5010/api/subscriptions/webpay/return";
    if (string.IsNullOrEmpty(o.CommerceCode))
        o.CommerceCode = builder.Configuration["WEBPAY_COMMERCE_CODE"] ?? "";
    if (string.IsNullOrEmpty(o.ApiKey))
        o.ApiKey = builder.Configuration["WEBPAY_API_KEY"] ?? "";
});
builder.Services.PostConfigure<BlobOptions>(o =>
{
    if (string.IsNullOrEmpty(o.ConnectionString))
        o.ConnectionString = builder.Configuration["AZURE_BLOB_CONNECTION_STRING"] ?? "";
    if (string.IsNullOrEmpty(o.MediaContainer))
        o.MediaContainer = builder.Configuration["AZURE_BLOB_CONTAINER"] ?? "social-hexa";
});

// Database (SQL Server)
var connStr = builder.Configuration["DB_CONNECTION_STRING"]
    ?? builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connStr));

// Data Protection — encrypts access tokens at rest, keys persisted so they survive restarts
var keysDir = new System.IO.DirectoryInfo(
    System.IO.Path.Combine(builder.Environment.ContentRootPath, "DataProtection-Keys"));
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(keysDir)
    .SetApplicationName("InstagramScheduler");

// JWT Auth
var jwtSecret = builder.Configuration["JWT_SECRET"]
    ?? builder.Configuration["Jwt:Secret"]
    ?? "default-secret-change-in-production-min32chars!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
        };
    });

// Hangfire (SQL Server)
builder.Services.AddHangfire(config =>
    config.SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
          .UseSimpleAssemblyNameTypeSerializer()
          .UseRecommendedSerializerSettings()
          .UseSqlServerStorage(connStr, new SqlServerStorageOptions
          {
              CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
              SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
              QueuePollInterval = TimeSpan.Zero,
              UseRecommendedIsolationLevel = true,
              DisableGlobalLocks = true
          }));
builder.Services.AddHangfireServer();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(
            builder.Configuration["FRONTEND_URL"] ?? "http://localhost:4200")
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials());
});

// Application services
builder.Services.AddScoped<SchedulerJobs>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPostService, PostService>();
builder.Services.AddScoped<IAiCaptionService, AiCaptionService>();
builder.Services.AddScoped<IAccountService, AccountService>();
builder.Services.AddScoped<IBlobStorageService, BlobStorageService>();

// Subscriptions & plans
builder.Services.AddScoped<IPlanService, PlanService>();
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();
builder.Services.AddScoped<IWebpayService, WebpayService>();

// Social publishers (Strategy pattern — add new platforms here)
builder.Services.AddScoped<ISocialPublisher, InstagramPublisher>();
builder.Services.AddScoped<ISocialPublisher, FacebookPublisher>();
builder.Services.AddScoped<PublisherFactory>();
builder.Services.AddScoped<SocialPublishingService>();

builder.Services.AddHttpClient();

builder.Services.AddControllers()
    .AddJsonOptions(o =>
        o.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Instagram Scheduler API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                    { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Auto-apply migrations on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.UseHangfireDashboard("/jobs");
app.MapControllers();

// Recurring jobs — must run after UseHangfireDashboard to ensure storage is initialized
var recurringJobs = app.Services.GetRequiredService<IRecurringJobManager>();
recurringJobs.AddOrUpdate<SchedulerJobs>("reconcile-posts",
    j => j.ReconcileScheduledPostsAsync(), "*/5 * * * *");
recurringJobs.AddOrUpdate<SchedulerJobs>("check-expiring-tokens",
    j => j.CheckExpiringTokensAsync(), Cron.Daily);
recurringJobs.AddOrUpdate<SchedulerJobs>("clean-orphaned-blobs",
    j => j.CleanOrphanedBlobsAsync(), Cron.Daily);
recurringJobs.AddOrUpdate<SchedulerJobs>("check-expired-subscriptions",
    j => j.CheckExpiredSubscriptionsAsync(), Cron.Daily);

app.Run();
