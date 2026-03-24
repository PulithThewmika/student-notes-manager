namespace NotesApi.Services;

using NotesApi.Models;

public interface IJwtService
{
    string GenerateToken(User user);
}
