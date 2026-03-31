namespace NotesApi.Services;

using NotesApi.DTOs;

public interface IAuthService
{
    Task<AuthResponse?> RegisterAsync(AuthInput input);
    Task<AuthResponse?> LoginAsync(AuthInput input);
    Task<AuthResponse?> GoogleLoginAsync(string credential);
}
