using DotNetEnv;
using NotesApi.Configuration;
using NotesApi.Endpoints;

Env.Load();

var builder = WebApplication.CreateBuilder(args);

// Register services
builder.Services.AddOpenApi();
builder.Services.AddHealthChecks();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy => 
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

// Configure dependencies using extension methods
builder.Services.AddMongoDb(builder.Configuration);
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddApplicationServices();

var app = builder.Build();

// Configure request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");

// Map endpoints
app.MapAuthEndpoints();
app.MapNotesEndpoints();
app.MapTrashEndpoints();

app.Run();
