namespace NotesApi.DTOs;

public class NoteInput
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsImportant { get; set; }
    public string Category { get; set; } = "Personal";
    public List<string>? Tags { get; set; }
    public string Color { get; set; } = "none";
    public bool IsPinned { get; set; }
    public bool IsFavorite { get; set; }
    public string? ChecklistJson { get; set; }
    public string? ScheduleJson { get; set; }
}
