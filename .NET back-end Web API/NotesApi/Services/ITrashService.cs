namespace NotesApi.Services;

using NotesApi.Models;

public interface ITrashService
{
    Task<List<TrashedNote>> GetAllAsync(string userId);
    Task<bool> MoveNoteToTrashAsync(string noteId, string userId);
    Task<Note?> RestoreAsync(string noteId, string userId);
    Task<bool> DeletePermanentAsync(string noteId, string userId);
    Task<int> EmptyTrashAsync(string userId);
}
