using Google.Apis.Auth;
using System.Net.Http.Headers;
using System.Text.Json;

namespace NotesApi.Services;

using MongoDB.Driver;
using NotesApi.Models;
using NotesApi.DTOs;

public class AuthService : IAuthService
{
    private readonly IMongoCollection<User> _usersCollection;
    private readonly IJwtService _jwtService;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;

    public AuthService(IMongoDatabase database, IJwtService jwtService, IConfiguration configuration, IHttpClientFactory httpClientFactory)
    {
        _usersCollection = database.GetCollection<User>("users");
        _jwtService = jwtService;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
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
            User = new UserResponse { Id = user.Id!, Username = user.Username, Email = user.Email, AvatarUrl = user.AvatarUrl } 
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
            User = new UserResponse { Id = user.Id!, Username = user.Username, Email = user.Email, AvatarUrl = user.AvatarUrl } 
        };
    }

    public async Task<AuthResponse?> GoogleLoginAsync(string credential)
    {
        // The frontend sends an OAuth2 access token from useGoogleLogin().
        // We validate it server-side by calling Google's UserInfo API.
        var httpClient = _httpClientFactory.CreateClient();
        httpClient.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", credential);

        var response = await httpClient.GetAsync("https://www.googleapis.com/oauth2/v3/userinfo");

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException("Invalid Google access token.");
        }

        var json = await response.Content.ReadAsStringAsync();
        var googleUser = JsonSerializer.Deserialize<GoogleUserInfo>(json);

        if (googleUser == null || string.IsNullOrEmpty(googleUser.Email))
        {
            throw new InvalidOperationException("Could not retrieve user info from Google.");
        }

        // Verify the token belongs to our app by checking the audience via tokeninfo
        var tokenInfoResponse = await httpClient.GetAsync(
            $"https://oauth2.googleapis.com/tokeninfo?access_token={credential}");
        
        if (tokenInfoResponse.IsSuccessStatusCode)
        {
            var tokenInfoJson = await tokenInfoResponse.Content.ReadAsStringAsync();
            var tokenInfo = JsonSerializer.Deserialize<GoogleTokenInfo>(tokenInfoJson);
            
            var expectedClientId = _configuration["GoogleAuth:ClientId"];
            if (tokenInfo != null && !string.IsNullOrEmpty(expectedClientId) 
                && tokenInfo.Aud != expectedClientId)
            {
                throw new InvalidOperationException("Token was not issued for this application.");
            }
        }

        // Find or create user
        var user = await _usersCollection.Find(u => u.Email == googleUser.Email).FirstOrDefaultAsync();

        if (user == null)
        {
            // Auto-register new Google user
            var username = googleUser.Name ?? googleUser.Email.Split('@')[0];
            
            // Ensure username uniqueness
            var existingUsername = await _usersCollection.Find(u => u.Username == username).FirstOrDefaultAsync();
            if (existingUsername != null)
            {
                username = $"{username}_{Guid.NewGuid().ToString("N")[..6]}";
            }

            user = new User
            {
                Email = googleUser.Email,
                Username = username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
                GoogleId = googleUser.Sub,
                AvatarUrl = googleUser.Picture
            };
            await _usersCollection.InsertOneAsync(user);
        }
        else if (string.IsNullOrEmpty(user.GoogleId))
        {
            // Link Google account to existing user
            var update = Builders<User>.Update
                .Set(u => u.GoogleId, googleUser.Sub)
                .Set(u => u.AvatarUrl, googleUser.Picture);
            await _usersCollection.UpdateOneAsync(u => u.Id == user.Id, update);
        }

        var token = _jwtService.GenerateToken(user);
        return new AuthResponse
        {
            Token = token,
            User = new UserResponse { Id = user.Id!, Username = user.Username, Email = user.Email, AvatarUrl = user.AvatarUrl }
        };
    }
}

// Internal DTOs for Google API responses
internal class GoogleUserInfo
{
    [System.Text.Json.Serialization.JsonPropertyName("sub")]
    public string? Sub { get; set; }
    
    [System.Text.Json.Serialization.JsonPropertyName("email")]
    public string? Email { get; set; }
    
    [System.Text.Json.Serialization.JsonPropertyName("email_verified")]
    public bool EmailVerified { get; set; }
    
    [System.Text.Json.Serialization.JsonPropertyName("name")]
    public string? Name { get; set; }
    
    [System.Text.Json.Serialization.JsonPropertyName("picture")]
    public string? Picture { get; set; }
}

internal class GoogleTokenInfo
{
    [System.Text.Json.Serialization.JsonPropertyName("aud")]
    public string? Aud { get; set; }
}
