namespace NotesApi.DTOs;

public class NoteInput
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsImportant { get; set; }
}
