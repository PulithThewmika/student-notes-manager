namespace NotesApi.Services;

using Microsoft.IdentityModel.Tokens;
using NotesApi.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

public class JwtService : IJwtService
{
    private readonly IConfiguration _configuration;

    public JwtService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user)
    {
        var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") 
            ?? _configuration["Jwt:Secret"];

        if (string.IsNullOrEmpty(jwtSecret) || jwtSecret.Length < 32)
        {
            throw new InvalidOperationException("JWT Secret is not configured or is too short. Please set JWT_SECRET in .env or appsettings.json.");
        }

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id!),
            new Claim("username", user.Username)
        };

        var jwtKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
        var creds = new SigningCredentials(jwtKey, SecurityAlgorithms.HmacSha256);
        
        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
