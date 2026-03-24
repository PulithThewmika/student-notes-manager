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
        if (string.IsNullOrWhiteSpace(input.Title) || string.IsNullOrWhiteSpace(input.Description))
            throw new ArgumentException("Title and Description are required.");

        var newNote = new Note
        {
            UserId = userId,
            Title = input.Title,
            Description = input.Description,
            IsImportant = input.IsImportant
        };

        await _notesCollection.InsertOneAsync(newNote);
        return newNote;
    }

    public async Task<bool> DeleteAsync(string id, string userId)
    {
        if (!ObjectId.TryParse(id, out _))
            throw new ArgumentException("Invalid ID format.");

        var result = await _notesCollection.DeleteOneAsync(n => n.Id == id && n.UserId == userId);
        return result.DeletedCount > 0;
    }

    public async Task<Note?> UpdateAsync(string id, string userId, NoteInput input)
    {
        if (!ObjectId.TryParse(id, out _))
            throw new ArgumentException("Invalid ID format.");

        if (string.IsNullOrWhiteSpace(input.Title) || string.IsNullOrWhiteSpace(input.Description))
            throw new ArgumentException("Title and Description are required.");

        var update = Builders<Note>.Update
            .Set(n => n.Title, input.Title)
            .Set(n => n.Description, input.Description)
            .Set(n => n.IsImportant, input.IsImportant);

        var options = new FindOneAndUpdateOptions<Note> { ReturnDocument = ReturnDocument.After };
        return await _notesCollection.FindOneAndUpdateAsync(
            n => n.Id == id && n.UserId == userId, update, options);
    }
}
