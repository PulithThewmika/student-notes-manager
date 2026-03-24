namespace NotesApi.Configuration;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using NotesApi.Services;
using System.Text;

public static class ServiceExtensions
{
    public static void AddMongoDb(this IServiceCollection services, IConfiguration config)
    {
        var mongoUri = Environment.GetEnvironmentVariable("MONGO_URI") 
            ?? config["MongoDb:Uri"] 
            ?? "mongodb://localhost:27017";
        var mongoDbName = Environment.GetEnvironmentVariable("MONGO_DB_NAME") 
            ?? config["MongoDb:DatabaseName"] 
            ?? "student_notes_db";

        var mongoClient = new MongoClient(mongoUri);
        var database = mongoClient.GetDatabase(mongoDbName);
        
        services.AddSingleton<IMongoDatabase>(database);
    }

    public static void AddJwtAuthentication(this IServiceCollection services, IConfiguration config)
    {
        var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") 
            ?? config["Jwt:Secret"];
            
        if (string.IsNullOrEmpty(jwtSecret) || jwtSecret.Length < 32)
        {
            throw new InvalidOperationException("JWT Secret is not configured or is too short. Please set JWT_SECRET in .env or appsettings.json.");
        }
            
        var jwtKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = jwtKey,
                    ClockSkew = TimeSpan.FromMinutes(1)
                };
            });
            
        services.AddAuthorization();
    }

    public static void AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<INotesService, NotesService>();
    }
}
