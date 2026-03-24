namespace NotesApi.Services;

using MongoDB.Driver;
using NotesApi.Models;
using NotesApi.DTOs;

public class AuthService : IAuthService
{
    private readonly IMongoCollection<User> _usersCollection;
    private readonly IJwtService _jwtService;

    public AuthService(IMongoDatabase database, IJwtService jwtService)
    {
        _usersCollection = database.GetCollection<User>("users");
        _jwtService = jwtService;
    }

    public async Task<AuthResponse?> RegisterAsync(AuthInput input)
    {
        if (string.IsNullOrWhiteSpace(input.Username) || string.IsNullOrWhiteSpace(input.Password))
            throw new ArgumentException("Username and password are required.");
        
        if (input.Username.Length < 3)
            throw new ArgumentException("Username must be at least 3 characters.");
            
        if (input.Password.Length < 6)
            throw new ArgumentException("Password must be at least 6 characters.");

        var existing = await _usersCollection.Find(u => u.Username == input.Username).FirstOrDefaultAsync();
        if (existing != null)
            throw new InvalidOperationException("Username already taken.");

        var user = new User
        {
            Username = input.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(input.Password)
        };

        await _usersCollection.InsertOneAsync(user);

        var token = _jwtService.GenerateToken(user);
        return new AuthResponse 
        { 
            Token = token, 
            User = new UserResponse { Id = user.Id!, Username = user.Username } 
        };
    }

    public async Task<AuthResponse?> LoginAsync(AuthInput input)
    {
        if (string.IsNullOrWhiteSpace(input.Username) || string.IsNullOrWhiteSpace(input.Password))
            throw new ArgumentException("Username and password are required.");

        var user = await _usersCollection.Find(u => u.Username == input.Username).FirstOrDefaultAsync();
        if (user == null || !BCrypt.Net.BCrypt.Verify(input.Password, user.PasswordHash))
            return null; // Return null on invalid credentials

        var token = _jwtService.GenerateToken(user);
        return new AuthResponse 
        { 
            Token = token, 
            User = new UserResponse { Id = user.Id!, Username = user.Username } 
        };
    }
}
