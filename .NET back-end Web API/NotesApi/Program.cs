using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Driver;
using DotNetEnv;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;

Env.Load();

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();
builder.Services.AddHealthChecks();

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

// JWT Configuration
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong!2024@NovaNotes";
var jwtKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
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

builder.Services.AddAuthorization();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

// Health check endpoint
app.MapHealthChecks("/health");

// MongoDB configuration
var mongoUri = Environment.GetEnvironmentVariable("MONGO_URI")
    ?? builder.Configuration.GetConnectionString("MongoUri")
    ?? "mongodb://localhost:27017";
var mongoDbName = Environment.GetEnvironmentVariable("MONGO_DB_NAME") ?? "student_notes_db";
var mongoCollectionName = Environment.GetEnvironmentVariable("MONGO_COLLECTION_NAME") ?? "notes";

var mongoClient = new MongoClient(mongoUri);
var database = mongoClient.GetDatabase(mongoDbName);
var notesCollection = database.GetCollection<Note>(mongoCollectionName);
var usersCollection = database.GetCollection<User>("users");

// ── Helper: Generate JWT ──
string GenerateToken(User user)
{
    var claims = new[]
    {
        new Claim(JwtRegisteredClaimNames.Sub, user.Id!),
        new Claim("username", user.Username)
    };

    var creds = new SigningCredentials(jwtKey, SecurityAlgorithms.HmacSha256);
    var token = new JwtSecurityToken(
        claims: claims,
        expires: DateTime.UtcNow.AddDays(7),
        signingCredentials: creds
    );

    return new JwtSecurityTokenHandler().WriteToken(token);
}

// ── Helper: Get userId from JWT claims ──
string? GetUserId(ClaimsPrincipal user)
{
    return user.FindFirstValue(JwtRegisteredClaimNames.Sub)
        ?? user.FindFirstValue(ClaimTypes.NameIdentifier);
}

// ════════════════════════════════════════════
//  AUTH ENDPOINTS (public)
// ════════════════════════════════════════════

// POST /api/auth/register
app.MapPost("/api/auth/register", async ([FromBody] AuthInput input) =>
{
    if (string.IsNullOrWhiteSpace(input.Username) || string.IsNullOrWhiteSpace(input.Password))
    {
        return Results.BadRequest(new { error = "Username and password are required." });
    }

    if (input.Username.Length < 3)
    {
        return Results.BadRequest(new { error = "Username must be at least 3 characters." });
    }

    if (input.Password.Length < 6)
    {
        return Results.BadRequest(new { error = "Password must be at least 6 characters." });
    }

    // Check if username already exists
    var existing = await usersCollection.Find(u => u.Username == input.Username).FirstOrDefaultAsync();
    if (existing != null)
    {
        return Results.Conflict(new { error = "Username already taken." });
    }

    var user = new User
    {
        Username = input.Username,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(input.Password)
    };

    await usersCollection.InsertOneAsync(user);

    var token = GenerateToken(user);
    return Results.Ok(new { token, user = new { id = user.Id, username = user.Username } });
});

// POST /api/auth/login
app.MapPost("/api/auth/login", async ([FromBody] AuthInput input) =>
{
    if (string.IsNullOrWhiteSpace(input.Username) || string.IsNullOrWhiteSpace(input.Password))
    {
        return Results.BadRequest(new { error = "Username and password are required." });
    }

    var user = await usersCollection.Find(u => u.Username == input.Username).FirstOrDefaultAsync();
    if (user == null || !BCrypt.Net.BCrypt.Verify(input.Password, user.PasswordHash))
    {
        return Results.Unauthorized();
    }

    var token = GenerateToken(user);
    return Results.Ok(new { token, user = new { id = user.Id, username = user.Username } });
});

// ════════════════════════════════════════════
//  NOTES ENDPOINTS (protected)
// ════════════════════════════════════════════

// GET /api/notes
app.MapGet("/api/notes", async (ClaimsPrincipal principal) =>
{
    var userId = GetUserId(principal);
    if (string.IsNullOrWhiteSpace(userId))
        return Results.Unauthorized();

    var allNotes = await notesCollection.Find(n => n.UserId == userId).ToListAsync();
    allNotes.Reverse();
    return Results.Ok(allNotes);
}).RequireAuthorization();

// POST /api/notes
app.MapPost("/api/notes", async (ClaimsPrincipal principal, [FromBody] NoteInput input) =>
{
    var userId = GetUserId(principal);
    if (string.IsNullOrWhiteSpace(userId))
        return Results.Unauthorized();

    if (string.IsNullOrWhiteSpace(input.Title) || string.IsNullOrWhiteSpace(input.Description))
    {
        return Results.BadRequest(new { Error = "Title and Description are required." });
    }

    var newNote = new Note
    {
        UserId = userId,
        Title = input.Title,
        Description = input.Description,
        IsImportant = input.IsImportant
    };

    await notesCollection.InsertOneAsync(newNote);
    return Results.Created($"/api/notes/{newNote.Id}", newNote);
}).RequireAuthorization();

// DELETE /api/notes/{id}
app.MapDelete("/api/notes/{id}", async (string id, ClaimsPrincipal principal) =>
{
    var userId = GetUserId(principal);
    if (string.IsNullOrWhiteSpace(userId))
        return Results.Unauthorized();

    if (!ObjectId.TryParse(id, out _))
    {
        return Results.BadRequest(new { Error = "Invalid ID format." });
    }

    var result = await notesCollection.DeleteOneAsync(n => n.Id == id && n.UserId == userId);
    if (result.DeletedCount == 0)
    {
        return Results.NotFound(new { Error = "Note not found or unauthorized." });
    }

    return Results.NoContent();
}).RequireAuthorization();

// PUT /api/notes/{id}
app.MapPut("/api/notes/{id}", async (string id, ClaimsPrincipal principal, [FromBody] NoteInput input) =>
{
    var userId = GetUserId(principal);
    if (string.IsNullOrWhiteSpace(userId))
        return Results.Unauthorized();

    if (!ObjectId.TryParse(id, out _))
    {
        return Results.BadRequest(new { Error = "Invalid ID format." });
    }

    if (string.IsNullOrWhiteSpace(input.Title) || string.IsNullOrWhiteSpace(input.Description))
    {
        return Results.BadRequest(new { Error = "Title and Description are required." });
    }

    var update = Builders<Note>.Update
        .Set(n => n.Title, input.Title)
        .Set(n => n.Description, input.Description)
        .Set(n => n.IsImportant, input.IsImportant);

    var options = new FindOneAndUpdateOptions<Note> { ReturnDocument = ReturnDocument.After };
    var updatedNote = await notesCollection.FindOneAndUpdateAsync(
        n => n.Id == id && n.UserId == userId, update, options);

    if (updatedNote == null)
    {
        return Results.NotFound(new { Error = "Note not found or unauthorized." });
    }

    return Results.Ok(updatedNote);
}).RequireAuthorization();

app.Run();

// ════════════════════════════════════════════
//  MODELS
// ════════════════════════════════════════════

class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("username")]
    public string Username { get; set; } = string.Empty;

    [JsonIgnore]
    public string PasswordHash { get; set; } = string.Empty;
}

class AuthInput
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

class Note
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("isImportant")]
    public bool IsImportant { get; set; }
}

class NoteInput
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsImportant { get; set; }
}
