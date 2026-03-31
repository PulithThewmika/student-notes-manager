namespace NotesApi.Endpoints;

using NotesApi.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

public static class TrashEndpoints
{
    private static string? GetUserId(ClaimsPrincipal user)
    {
        return user.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? user.FindFirstValue(ClaimTypes.NameIdentifier);
    }

    public static void MapTrashEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/trash").RequireAuthorization();

        group.MapGet("/", async (ITrashService trashService, ClaimsPrincipal principal) =>
        {
            var userId = GetUserId(principal);
            if (string.IsNullOrWhiteSpace(userId))
                return Results.Unauthorized();

            var items = await trashService.GetAllAsync(userId);
            return Results.Ok(items);
        });

        group.MapPost("/{id}/restore", async (ITrashService trashService, string id, ClaimsPrincipal principal) =>
        {
            var userId = GetUserId(principal);
            if (string.IsNullOrWhiteSpace(userId))
                return Results.Unauthorized();

            try
            {
                var note = await trashService.RestoreAsync(id, userId);
                if (note == null)
                    return Results.NotFound(new { Error = "Trashed note not found or unauthorized." });

                return Results.Ok(note);
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { Error = ex.Message });
            }
        });

        group.MapDelete("/all", async (ITrashService trashService, ClaimsPrincipal principal) =>
        {
            var userId = GetUserId(principal);
            if (string.IsNullOrWhiteSpace(userId))
                return Results.Unauthorized();

            var count = await trashService.EmptyTrashAsync(userId);
            return Results.Ok(new { deleted = count });
        });

        group.MapDelete("/{id}", async (ITrashService trashService, string id, ClaimsPrincipal principal) =>
        {
            var userId = GetUserId(principal);
            if (string.IsNullOrWhiteSpace(userId))
                return Results.Unauthorized();

            try
            {
                var deleted = await trashService.DeletePermanentAsync(id, userId);
                if (!deleted)
                    return Results.NotFound(new { Error = "Trashed note not found or unauthorized." });

                return Results.NoContent();
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { Error = ex.Message });
            }
        });
    }
}
