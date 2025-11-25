# 🗄️ PostgreSQL Database Setup Guide

## Prerequisites
1. PostgreSQL installed locally or access to a PostgreSQL server
2. Node.js and npm installed

## Step 1: Install Dependencies
```bash
cd backend
npm install @prisma/client prisma uuid
npm install --save-dev prisma
```

## Step 2: Database Setup

### Option A: Local PostgreSQL Installation
1. **Install PostgreSQL** (if not already installed):
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql postgresql-contrib`

2. **Create Database**:
   ```sql
   -- Connect to PostgreSQL as superuser
   sudo -u postgres psql
   
   -- Create database
   CREATE DATABASE email_productivity_agent;
   
   -- Create user (optional)
   CREATE USER email_agent WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE email_productivity_agent TO email_agent;
   
   -- Exit
   \q
   ```

### Option B: Docker PostgreSQL (Recommended for Development)
```bash
# Run PostgreSQL in Docker
docker run --name email-postgres \
  -e POSTGRES_DB=email_productivity_agent \
  -e POSTGRES_USER=email_agent \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:15

# Check if running
docker ps
```

## Step 3: Environment Configuration
1. **Copy environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Update .env file** with your database credentials:
   ```env
   DATABASE_URL="postgresql://email_agent:your_password@localhost:5432/email_productivity_agent"
   ```

## Step 4: Prisma Setup & Migration
```bash
# Generate Prisma client
npx prisma generate

# Run database migration (creates all tables)
npx prisma migrate dev --name init

# Optional: View database in Prisma Studio
npx prisma studio
```

## Step 5: Verify Database Setup
```bash
# Test connection
npx prisma db push

# Seed with default prompts (optional)
node -e "
const { resetToDefaultPrompts } = require('./db/prompts');
resetToDefaultPrompts().then(() => console.log('✅ Default prompts seeded'));
"
```

## Step 6: Update Server Configuration

Add database routes to your `server.js`:

```javascript
// Add these imports
const emailDBRoutes = require('./routes/emailsDB');
const promptDBRoutes = require('./routes/promptsDB');
const draftDBRoutes = require('./routes/draftsDB');

// Add these routes (with database integration)
app.use('/api/emails-db', emailDBRoutes);
app.use('/api/prompts-db', promptDBRoutes);
app.use('/api/drafts-db', draftDBRoutes);

// Keep original routes as fallback
app.use('/api/emails', emailRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/drafts', draftRoutes);
```

## Step 7: Test Database Integration

### Load Mock Data
```bash
# Start your backend server
npm start

# In another terminal, load mock data
curl -X POST http://localhost:5001/api/emails-db/load-mock
```

### Test API Endpoints
```bash
# Get emails from database
curl http://localhost:5001/api/emails-db/

# Get prompts from database  
curl http://localhost:5001/api/prompts-db/

# Get drafts from database
curl http://localhost:5001/api/drafts-db/
```

## Step 8: Frontend Integration

Update your frontend's `apiService.ts` to use database endpoints:

```typescript
// In apiService.ts, change the base URL or add new methods
const API_BASE_URL_DB = 'http://localhost:5001/api';

// Add database-specific methods
async getEmailsFromDB() {
  return this.request('/emails-db');
}

async loadMockInbox() {
  return this.request('/emails-db/load-mock', { method: 'POST' });
}
```

## Troubleshooting

### Common Issues:

1. **Connection refused**: Check if PostgreSQL is running
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Or for Docker
   docker ps
   ```

2. **Authentication failed**: Verify DATABASE_URL credentials

3. **Migration errors**: Drop and recreate database
   ```bash
   npx prisma migrate reset
   ```

4. **Port conflicts**: Change PostgreSQL port in docker or .env

### Useful Commands:
```bash
# Reset database
npx prisma migrate reset

# Apply schema changes
npx prisma db push

# View database
npx prisma studio

# Generate new migration
npx prisma migrate dev --name your_migration_name
```

## Production Deployment

For production, use a managed PostgreSQL service:
- **Heroku**: Heroku Postgres
- **Vercel**: Vercel Postgres  
- **Railway**: Railway PostgreSQL
- **Supabase**: Supabase PostgreSQL

Update your `DATABASE_URL` accordingly and run:
```bash
npx prisma migrate deploy
```