# External Database Configuration Guide

This guide explains how to connect the Abbit API to an external PostgreSQL database (e.g., AWS RDS, DigitalOcean Managed Database, Supabase, Neon).

## 1. Prerequisites
- A running PostgreSQL database (Version 15+ recommended).
- Connection details: Host, Port, Database Name, Username, Password.
- Allow-list IP configured (if your provider requires it) to allow access from your deployment server.

## 2. Configuration Steps

The application uses the `DATABASE_URL` environment variable to connect to the database.

1.  Open or create the `.env` file in `apps/api/`.
2.  Locate or add the `DATABASE_URL` variable.
3.  Set the value using the following connection string format:

```bash
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]"
```

### Examples

**Standard Connection:**
```bash
DATABASE_URL="postgresql://admin:supersecret@db.example.com:5432/abbit_prod"
```

**With SSL (Required by many cloud providers):**
Append `?sslmode=require` (or `no-verify` if using self-signed certs) to the end of the URL.
```bash
DATABASE_URL="postgresql://admin:supersecret@db.example.com:5432/abbit_prod?sslmode=require"
```

**Supabase (Transaction Pooler):**
Supabase often provides a transaction pooler on port 6543.
```bash
DATABASE_URL="postgresql://postgres.projectid:password@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

## 3. Migrating Data (Optional)

If you have existing data in your local Docker database and want to move it to the external cloud database, follow these steps.

### Step 3.1: Export Local Data
Run this command to create a backup file (`dump.sql`) from your running local container:

```bash
docker exec -t abbit-db pg_dump -U postgres -d abbit --clean --if-exists > dump.sql
```
*Note: `abbit-db` is the container name defined in docker-compose.yml.*

### Step 3.2: Import to External Database
Use `psql` to restore the backup to your new external database.

```bash
# General Syntax
psql "[Your External DATABASE_URL]" < dump.sql

# Example
psql "postgresql://admin:password@remote-db.com:5432/abbit_prod?sslmode=require" < dump.sql
```

## 4. Verification

1.  Update the `.env` file with your new `DATABASE_URL`.
2.  Restart the application:
    ```bash
    # If running with docker-compose
    docker-compose down
    docker-compose up -d api

    # If running locally with npm
    cd apps/api
    npm run start:dev
    ```
3.  Check the logs. You should see a successful TypeORM connection message and no errors regarding connection timeouts.

## 5. Troubleshooting

-   **Connection Refused**: Check your database firewall / security groups. Ensure your current IP is whitelisted.
-   **SSL Error**: Try adding `?sslmode=require` or `?sslmode=no-verify` to the connection string.
-   **Schema Sync**: The application is currently configured with `synchronize: true`. This will automatically create tables in your new empty database on the first run. **WARNING**: In production, it is recommended to disable this and use migrations.
