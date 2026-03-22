using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Driver;
using DotNetEnv;
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

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowAll");

// Health check endpoint
app.MapHealthChecks("/health");

// MongoDB configuration
var mongoUri = Environment.GetEnvironmentVariable("MONGO_URI") ?? builder.Configuration.GetConnectionString("MongoUri") ?? "mongodb://localhost:27017";
var mongoDbName = Environment.GetEnvironmentVariable("MONGO_DB_NAME") ?? "student_notes_db";
var mongoCollectionName = Environment.GetEnvironmentVariable("MONGO_COLLECTION_NAME") ?? "notes";

var mongoClient = new MongoClient(mongoUri);
var notesDatabase = mongoClient.GetDatabase(mongoDbName);
var notesCollection = notesDatabase.GetCollection<Note>(mongoCollectionName);

// GET /api/notes
app.MapGet("/api/notes", async () =>
{
    var allNotes = await notesCollection.Find(_ => true).ToListAsync();
    allNotes.Reverse(); // basic reverse since objects map to insert order conceptually
    return Results.Ok(allNotes);
});

// POST /api/notes
app.MapPost("/api/notes", async ([FromBody] NoteInput input) =>
{
    if (string.IsNullOrWhiteSpace(input.Title) || string.IsNullOrWhiteSpace(input.Description))
    {
        return Results.BadRequest(new { Error = "Title and Description are required." });
    }

    var newNote = new Note
    {
        Title = input.Title,
        Description = input.Description,
        IsImportant = input.IsImportant
    };
    
    await notesCollection.InsertOneAsync(newNote);
    return Results.Created($"/api/notes/{newNote.Id}", newNote);
});

// DELETE /api/notes/{id}
app.MapDelete("/api/notes/{id}", async (string id) =>
{
    if (!ObjectId.TryParse(id, out _))
    {
        return Results.BadRequest(new { Error = "Invalid ID format." });
    }

    var result = await notesCollection.DeleteOneAsync(n => n.Id == id);
    if (result.DeletedCount == 0)
    {
        return Results.NotFound(new { Error = "Note not found." });
    }
    
    return Results.NoContent();
});

// PUT /api/notes/{id}
app.MapPut("/api/notes/{id}", async (string id, [FromBody] NoteInput input) =>
{
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
    var updatedNote = await notesCollection.FindOneAndUpdateAsync(n => n.Id == id, update, options);

    if (updatedNote == null)
    {
        return Results.NotFound(new { Error = "Note not found." });
    }

    return Results.Ok(updatedNote);
});

app.Run();

class Note
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonPropertyName("id")]
    public string? Id { get; set; }
    
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
