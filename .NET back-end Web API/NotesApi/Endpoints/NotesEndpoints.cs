namespace NotesApi.Endpoints;

using Microsoft.AspNetCore.Mvc;
using NotesApi.DTOs;
using NotesApi.Services;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

public static class NotesEndpoints
{
    private static string? GetUserId(ClaimsPrincipal user)
    {
        return user.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? user.FindFirstValue(ClaimTypes.NameIdentifier);
    }

    public static void MapNotesEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/notes").RequireAuthorization();

        group.MapGet("/", async (INotesService notesService, ClaimsPrincipal principal) =>
        {
            var userId = GetUserId(principal);
            if (string.IsNullOrWhiteSpace(userId))
                return Results.Unauthorized();

            var allNotes = await notesService.GetAllAsync(userId);
            return Results.Ok(allNotes);
        });

        group.MapPost("/", async (INotesService notesService, ClaimsPrincipal principal, [FromBody] NoteInput input) =>
        {
            var userId = GetUserId(principal);
            if (string.IsNullOrWhiteSpace(userId))
                return Results.Unauthorized();

            try
            {
                var newNote = await notesService.CreateAsync(userId, input);
                return Results.Created($"/api/notes/{newNote.Id}", newNote);
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { Error = ex.Message });
            }
        });

        group.MapDelete("/{id}", async (INotesService notesService, string id, ClaimsPrincipal principal) =>
        {
            var userId = GetUserId(principal);
            if (string.IsNullOrWhiteSpace(userId))
                return Results.Unauthorized();

            try
            {
                var deleted = await notesService.DeleteAsync(id, userId);
                if (!deleted)
                    return Results.NotFound(new { Error = "Note not found or unauthorized." });

                return Results.NoContent();
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { Error = ex.Message });
            }
        });

        group.MapPut("/{id}", async (INotesService notesService, string id, ClaimsPrincipal principal, [FromBody] NoteInput input) =>
        {
            var userId = GetUserId(principal);
            if (string.IsNullOrWhiteSpace(userId))
                return Results.Unauthorized();

            try
            {
                var updatedNote = await notesService.UpdateAsync(id, userId, input);
                if (updatedNote == null)
                    return Results.NotFound(new { Error = "Note not found or unauthorized." });

                return Results.Ok(updatedNote);
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { Error = ex.Message });
            }
        });
    }
}
