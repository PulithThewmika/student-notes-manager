namespace NotesApi.Models;

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

/// <summary>
/// Snapshot of a note moved to trash. Uses the same <see cref="Id"/> as the original note
/// so restore keeps stable identifiers for clients.
/// </summary>
[BsonIgnoreExtraElements]
public class TrashedNote
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;

    [JsonPropertyName("trashedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime TrashedAt { get; set; }

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("isImportant")]
    public bool IsImportant { get; set; }

    [JsonPropertyName("category")]
    public string Category { get; set; } = "Personal";

    [JsonPropertyName("tags")]
    public List<string> Tags { get; set; } = new();

    [JsonPropertyName("color")]
    public string Color { get; set; } = "none";

    [JsonPropertyName("isPinned")]
    public bool IsPinned { get; set; }

    [JsonPropertyName("isFavorite")]
    public bool IsFavorite { get; set; }

    [JsonPropertyName("checklistJson")]
    public string? ChecklistJson { get; set; }

    [JsonPropertyName("scheduleJson")]
    public string? ScheduleJson { get; set; }

    [JsonPropertyName("createdAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("updatedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime UpdatedAt { get; set; }

    public static TrashedNote FromNote(Note note, DateTime trashedAtUtc) => new()
    {
        Id = note.Id,
        UserId = note.UserId,
        TrashedAt = trashedAtUtc,
        Title = note.Title,
        Description = note.Description,
        IsImportant = note.IsImportant,
        Category = note.Category,
        Tags = note.Tags?.ToList() ?? new List<string>(),
        Color = note.Color,
        IsPinned = note.IsPinned,
        IsFavorite = note.IsFavorite,
        ChecklistJson = note.ChecklistJson,
        ScheduleJson = note.ScheduleJson,
        CreatedAt = note.CreatedAt,
        UpdatedAt = note.UpdatedAt
    };

    public Note ToNote() => new()
    {
        Id = Id,
        UserId = UserId,
        Title = Title,
        Description = Description,
        IsImportant = IsImportant,
        Category = Category,
        Tags = Tags?.ToList() ?? new List<string>(),
        Color = Color,
        IsPinned = IsPinned,
        IsFavorite = IsFavorite,
        ChecklistJson = ChecklistJson,
        ScheduleJson = ScheduleJson,
        CreatedAt = CreatedAt,
        UpdatedAt = DateTime.UtcNow
    };
}
