namespace NotesApi.Services;

using NotesApi.Models;
using NotesApi.DTOs;

public interface INotesService
{
    Task<List<Note>> GetAllAsync(string userId);
    Task<Note> CreateAsync(string userId, NoteInput input);
    Task<bool> DeleteAsync(string id, string userId);
    Task<Note?> UpdateAsync(string id, string userId, NoteInput input);
}
