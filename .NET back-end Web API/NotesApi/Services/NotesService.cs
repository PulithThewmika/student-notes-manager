namespace NotesApi.Services;

using MongoDB.Bson;
using MongoDB.Driver;
using NotesApi.Models;
using NotesApi.DTOs;

public class NotesService : INotesService
{
    private readonly IMongoCollection<Note> _notesCollection;

    public NotesService(IMongoDatabase database, IConfiguration configuration)
    {
        var collectionName = Environment.GetEnvironmentVariable("MONGO_COLLECTION_NAME")
            ?? configuration["MongoDb:NotesCollection"]
            ?? "notes";
        _notesCollection = database.GetCollection<Note>(collectionName);
    }

    public async Task<List<Note>> GetAllAsync(string userId)
    {
        var allNotes = await _notesCollection.Find(n => n.UserId == userId).ToListAsync();
        allNotes.Reverse();
        return allNotes;
    }

    public async Task<Note> CreateAsync(string userId, NoteInput input)
    {
        var now = DateTime.UtcNow;
        var note = BuildNoteFromInput(userId, input, now, now);
        await _notesCollection.InsertOneAsync(note);
        return note;
    }

    public async Task<Note?> UpdateAsync(string id, string userId, NoteInput input)
    {
        if (!ObjectId.TryParse(id, out _))
            throw new ArgumentException("Invalid ID format.");

        var existing = await _notesCollection.Find(n => n.Id == id && n.UserId == userId).FirstOrDefaultAsync();
        if (existing == null)
            return null;

        var created = existing.CreatedAt == default ? DateTime.UtcNow : existing.CreatedAt;
        var now = DateTime.UtcNow;
        var merged = BuildNoteFromInput(userId, input, created, now);
        merged.Id = id;

        var replaceResult = await _notesCollection.ReplaceOneAsync(n => n.Id == id && n.UserId == userId, merged);
        return replaceResult.MatchedCount > 0 ? merged : null;
    }

    private static Note BuildNoteFromInput(string userId, NoteInput input, DateTime createdAt, DateTime updatedAt)
    {
        var title = string.IsNullOrWhiteSpace(input.Title) ? "Untitled" : input.Title.Trim();
        var description = input.Description ?? string.Empty;
        var category = string.IsNullOrWhiteSpace(input.Category) ? "Personal" : input.Category.Trim();
        var color = string.IsNullOrWhiteSpace(input.Color) ? "none" : input.Color.Trim();
        var tags = input.Tags ?? new List<string>();
        var checklist = string.IsNullOrWhiteSpace(input.ChecklistJson) ? "[]" : input.ChecklistJson!;
        var schedule = string.IsNullOrWhiteSpace(input.ScheduleJson) ? null : input.ScheduleJson;

        return new Note
        {
            UserId = userId,
            Title = title,
            Description = description,
            IsPinned = input.IsPinned,
            IsFavorite = input.IsFavorite,
            IsImportant = input.IsImportant || input.IsPinned || input.IsFavorite,
            Category = category,
            Tags = tags,
            Color = color,
            ChecklistJson = checklist,
            ScheduleJson = schedule,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt
        };
    }
}
