public class AppDbContext : DbContext
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Category> Categories => Set<Category>();
    // …kolejne DbSety

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder b)
    {
        // rozszerzenia
        b.HasPostgresExtension("vector");
        b.HasPostgresExtension("citext");
        b.HasPostgresExtension("ltree");

        // przykładowa konfiguracja
        b.Entity<User>(e =>
        {
            e.ToTable("users");
            e.HasKey(x => x.Id);
            e.Property(x => x.Email).HasColumnType("citext").IsRequired();
            e.Property(x => x.PrefsVec).HasColumnType("vector(128)");
        });

        // …pozostałe encje
    }
}
