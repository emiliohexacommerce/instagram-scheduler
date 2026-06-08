using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InstagramScheduler.API.Migrations
{
    /// <inheritdoc />
    public partial class AddThreadsPlatform : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // SocialPlatform.Threads = 3 is stored as int — no schema change needed
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
