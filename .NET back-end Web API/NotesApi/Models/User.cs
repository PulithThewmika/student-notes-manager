namespace NotesApi.Models;

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

public class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("username")]
    public string Username { get; set; } = string.Empty;

    [JsonIgnore]
    public string PasswordHash { get; set; } = string.Empty;
}
