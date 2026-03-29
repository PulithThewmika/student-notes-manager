namespace NotesApi.Services;

using NotesApi.Models;
using NotesApi.DTOs;

public interface INotesService
{
    Task<List<Note>> GetAllAsync(string userId);
    Task<Note> CreateAsync(string userId, NoteInput input);
    Task<Note?> UpdateAsync(string id, string userId, NoteInput input);
}
