using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();

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

// In-memory data store
var notes = new List<Note>();
int nextId = 1;

// GET /api/notes
app.MapGet("/api/notes", () =>
{
    return Results.Ok(notes.OrderByDescending(n => n.Id));
});

// POST /api/notes
app.MapPost("/api/notes", ([FromBody] NoteInput input) =>
{
    if (string.IsNullOrWhiteSpace(input.Title) || string.IsNullOrWhiteSpace(input.Description))
    {
        return Results.BadRequest(new { Error = "Title and Description are required." });
    }

    var newNote = new Note
    {
        Id = nextId++,
        Title = input.Title,
        Description = input.Description,
        IsImportant = input.IsImportant
    };
    
    notes.Add(newNote);
    return Results.Created($"/api/notes/{newNote.Id}", newNote);
});

// DELETE /api/notes/{id}
app.MapDelete("/api/notes/{id}", (int id) =>
{
    var note = notes.FirstOrDefault(n => n.Id == id);
    if (note == null)
    {
        return Results.NotFound(new { Error = "Note not found." });
    }
    
    notes.Remove(note);
    return Results.NoContent();
});

// PUT /api/notes/{id}
app.MapPut("/api/notes/{id}", (int id, [FromBody] NoteInput input) =>
{
    var note = notes.FirstOrDefault(n => n.Id == id);
    if (note == null)
    {
        return Results.NotFound(new { Error = "Note not found." });
    }

    if (string.IsNullOrWhiteSpace(input.Title) || string.IsNullOrWhiteSpace(input.Description))
    {
        return Results.BadRequest(new { Error = "Title and Description are required." });
    }
    
    note.Title = input.Title;
    note.Description = input.Description;
    note.IsImportant = input.IsImportant;
    
    return Results.Ok(note);
});

app.Run();

class Note
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsImportant { get; set; }
}

class NoteInput
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsImportant { get; set; }
}
