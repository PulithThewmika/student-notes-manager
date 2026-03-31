namespace NotesApi.Services;

using MongoDB.Bson;
using MongoDB.Driver;
using NotesApi.Models;

public class TrashService : ITrashService
{
    private readonly IMongoCollection<Note> _notesCollection;
    private readonly IMongoCollection<TrashedNote> _trashCollection;

    public TrashService(IMongoDatabase database, IConfiguration configuration)
    {
        var notesName = Environment.GetEnvironmentVariable("MONGO_COLLECTION_NAME")
            ?? configuration["MongoDb:NotesCollection"]
            ?? "notes";
        var trashName = configuration["MongoDb:TrashCollection"] ?? "trash";

        _notesCollection = database.GetCollection<Note>(notesName);
        _trashCollection = database.GetCollection<TrashedNote>(trashName);
    }

    public async Task<List<TrashedNote>> GetAllAsync(string userId)
    {
        var list = await _trashCollection.Find(t => t.UserId == userId).ToListAsync();
        list.Sort((a, b) => b.TrashedAt.CompareTo(a.TrashedAt));
        return list;
    }

    public async Task<bool> MoveNoteToTrashAsync(string noteId, string userId)
    {
        if (!ObjectId.TryParse(noteId, out _))
            throw new ArgumentException("Invalid ID format.");

        var note = await _notesCollection.Find(n => n.Id == noteId && n.UserId == userId).FirstOrDefaultAsync();
        if (note == null)
            return false;

        var trashed = TrashedNote.FromNote(note, DateTime.UtcNow);
        await _trashCollection.InsertOneAsync(trashed);
        var del = await _notesCollection.DeleteOneAsync(n => n.Id == noteId && n.UserId == userId);
        return del.DeletedCount > 0;
    }

    public async Task<Note?> RestoreAsync(string noteId, string userId)
    {
        if (!ObjectId.TryParse(noteId, out _))
            throw new ArgumentException("Invalid ID format.");

        var trashed = await _trashCollection.Find(t => t.Id == noteId && t.UserId == userId).FirstOrDefaultAsync();
        if (trashed == null)
            return null;

        var note = trashed.ToNote();
        await _notesCollection.InsertOneAsync(note);
        await _trashCollection.DeleteOneAsync(t => t.Id == noteId && t.UserId == userId);
        return note;
    }

    public async Task<bool> DeletePermanentAsync(string noteId, string userId)
    {
        if (!ObjectId.TryParse(noteId, out _))
            throw new ArgumentException("Invalid ID format.");

        var result = await _trashCollection.DeleteOneAsync(t => t.Id == noteId && t.UserId == userId);
        return result.DeletedCount > 0;
    }

    public async Task<int> EmptyTrashAsync(string userId)
    {
        var result = await _trashCollection.DeleteManyAsync(t => t.UserId == userId);
        return (int)result.DeletedCount;
    }
}
