namespace Match.Infrastructure;

public class AppDbContext : DbContext
{
    public DbSet<User> Users => Set<User>();
    // …

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.HasPostgresExtension("vector")  // gwarancja przy migracji
         .HasPostgresExtension("citext")
         .HasPostgresExtension("ltree");

        // konfiguracja encji…
    }
}
