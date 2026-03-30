using Google.Apis.Auth;

namespace NotesApi.Services;

using MongoDB.Driver;
using NotesApi.Models;
using NotesApi.DTOs;

public class AuthService : IAuthService
{
    private readonly IMongoCollection<User> _usersCollection;
    private readonly IJwtService _jwtService;
    private readonly IConfiguration _configuration;

    public AuthService(IMongoDatabase database, IJwtService jwtService, IConfiguration configuration)
    {
        _usersCollection = database.GetCollection<User>("users");
        _jwtService = jwtService;
        _configuration = configuration;
    }

    public async Task<AuthResponse?> RegisterAsync(AuthInput input)
    {
        if (string.IsNullOrWhiteSpace(input.Username) || string.IsNullOrWhiteSpace(input.Password) || string.IsNullOrWhiteSpace(input.Email))
            throw new ArgumentException("Email, username, and password are required.");
        
        if (input.Username.Length < 3)
            throw new ArgumentException("Username must be at least 3 characters.");
            
        if (input.Password.Length < 6)
            throw new ArgumentException("Password must be at least 6 characters.");

        var existing = await _usersCollection.Find(u => u.Username == input.Username || u.Email == input.Email).FirstOrDefaultAsync();
        if (existing != null)
            throw new InvalidOperationException("Username or email already taken.");

        var user = new User
        {
            Email = input.Email,
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
            throw new ArgumentException("Username/Email and password are required.");

        var user = await _usersCollection.Find(u => u.Username == input.Username || u.Email == input.Username).FirstOrDefaultAsync();
        if (user == null || !BCrypt.Net.BCrypt.Verify(input.Password, user.PasswordHash))
            return null; // Return null on invalid credentials

        var token = _jwtService.GenerateToken(user);
        return new AuthResponse 
        { 
            Token = token, 
            User = new UserResponse { Id = user.Id!, Username = user.Username } 
        };
    }

    public async Task<AuthResponse?> GoogleLoginAsync(string credential)
    {
        var settings = new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = new[] { _configuration["GoogleAuth:ClientId"] }
        };

        var payload = await GoogleJsonWebSignature.ValidateAsync(credential, settings);

        var user = await _usersCollection.Find(u => u.Email == payload.Email).FirstOrDefaultAsync();

        if (user == null)
        {
            // Register new user
            user = new User
            {
                Email = payload.Email,
                Username = payload.Name,
                // Assign a strong random password, as they won't use it to login
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString())
            };
            await _usersCollection.InsertOneAsync(user);
        }

        var token = _jwtService.GenerateToken(user);
        return new AuthResponse
        {
            Token = token,
            User = new UserResponse { Id = user.Id!, Username = user.Username }
        };
    }
}
