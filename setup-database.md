# Database Setup Instructions

## 1. Start the PostgreSQL Database

First, make sure Docker is running, then start the database:

```bash
pnpm db:start
```

This will start PostgreSQL with:
- Database name: `vector_dashboard`
- Username: `postgres`
- Password: `postgres`
- Port: `5438` (mapped from container's 5432)

## 2. Create .env.local file

Create a `.env.local` file in the root directory with:

```env
# Authentication
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5438/vector_dashboard
```

## 3. Run Database Migrations

After the database is running, run the migrations:

```bash
pnpm db:push
```

Or if you prefer to generate and run migrations separately:

```bash
pnpm db:generate
pnpm db:migrate
```

## 4. Verify Database Setup

You can verify the database is set up correctly by:

```bash
pnpm db:studio
```

This will open Drizzle Studio where you can see your database tables.

## Troubleshooting

If you get a "database does not exist" error:
1. Make sure Docker is running
2. Check that the database container is running: `docker ps`
3. Verify the DATABASE_URL in .env.local matches the docker-compose configuration
4. Try stopping and restarting the database: `pnpm db:stop` then `pnpm db:start`