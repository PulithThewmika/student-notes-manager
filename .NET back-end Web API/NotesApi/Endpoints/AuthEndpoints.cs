namespace NotesApi.Endpoints;

using Microsoft.AspNetCore.Mvc;
using NotesApi.DTOs;
using NotesApi.Services;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth");

        group.MapPost("/register", async (IAuthService authService, [FromBody] AuthInput input) =>
        {
            try
            {
                var response = await authService.RegisterAsync(input);
                return Results.Ok(response);
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(new { error = ex.Message });
            }
        });

        group.MapPost("/login", async (IAuthService authService, [FromBody] AuthInput input) =>
        {
            try
            {
                var response = await authService.LoginAsync(input);
                if (response == null)
                    return Results.Unauthorized();
                
                return Results.Ok(response);
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        });

        group.MapPost("/google-login", async (IAuthService authService, [FromBody] GoogleAuthInput input) =>
        {
            try
            {
                var response = await authService.GoogleLoginAsync(input.Credential);
                if (response == null)
                    return Results.Unauthorized();

                return Results.Ok(response);
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        });
    }
}
