using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InstagramScheduler.API.Migrations
{
    /// <inheritdoc />
    public partial class AddSocialPlatformSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ScheduledPosts_InstagramAccounts_AccountId",
                table: "ScheduledPosts");

            migrationBuilder.DropTable(
                name: "InstagramAccounts");

            migrationBuilder.DropColumn(
                name: "ErrorMessage",
                table: "ScheduledPosts");

            migrationBuilder.DropColumn(
                name: "InstagramPostId",
                table: "ScheduledPosts");

            migrationBuilder.DropColumn(
                name: "PublishedAt",
                table: "ScheduledPosts");

            migrationBuilder.RenameColumn(
                name: "AccountId",
                table: "ScheduledPosts",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_ScheduledPosts_AccountId_Status",
                table: "ScheduledPosts",
                newName: "IX_ScheduledPosts_UserId_Status");

            migrationBuilder.AddColumn<string>(
                name: "Platforms",
                table: "ScheduledPosts",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Results",
                table: "ScheduledPosts",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "SocialAccounts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Platform = table.Column<int>(type: "int", nullable: false),
                    PlatformUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Username = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProfilePictureUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AccessToken = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RefreshToken = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TokenExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    ConnectedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SocialAccounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SocialAccounts_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SocialAccounts_TokenExpiresAt",
                table: "SocialAccounts",
                column: "TokenExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_SocialAccounts_UserId_Platform_IsActive",
                table: "SocialAccounts",
                columns: new[] { "UserId", "Platform", "IsActive" });

            migrationBuilder.AddForeignKey(
                name: "FK_ScheduledPosts_Users_UserId",
                table: "ScheduledPosts",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ScheduledPosts_Users_UserId",
                table: "ScheduledPosts");

            migrationBuilder.DropTable(
                name: "SocialAccounts");

            migrationBuilder.DropColumn(
                name: "Platforms",
                table: "ScheduledPosts");

            migrationBuilder.DropColumn(
                name: "Results",
                table: "ScheduledPosts");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "ScheduledPosts",
                newName: "AccountId");

            migrationBuilder.RenameIndex(
                name: "IX_ScheduledPosts_UserId_Status",
                table: "ScheduledPosts",
                newName: "IX_ScheduledPosts_AccountId_Status");

            migrationBuilder.AddColumn<string>(
                name: "ErrorMessage",
                table: "ScheduledPosts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InstagramPostId",
                table: "ScheduledPosts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PublishedAt",
                table: "ScheduledPosts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "InstagramAccounts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    AccessToken = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConnectedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    InstagramUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProfilePictureUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TokenExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Username = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InstagramAccounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InstagramAccounts_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_InstagramAccounts_TokenExpiresAt",
                table: "InstagramAccounts",
                column: "TokenExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_InstagramAccounts_UserId_IsActive",
                table: "InstagramAccounts",
                columns: new[] { "UserId", "IsActive" });

            migrationBuilder.AddForeignKey(
                name: "FK_ScheduledPosts_InstagramAccounts_AccountId",
                table: "ScheduledPosts",
                column: "AccountId",
                principalTable: "InstagramAccounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
