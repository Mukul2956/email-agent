#!/usr/bin/env node

/**
 * Database Integration Setup Script
 * Run this to set up PostgreSQL integration for your Email Productivity Agent
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Email Productivity Agent - Database Integration Setup\n');

// Check if we're in the backend directory
const currentDir = process.cwd();
if (!fs.existsSync('package.json') || !currentDir.includes('backend')) {
  console.error('❌ Please run this script from the backend directory');
  process.exit(1);
}

async function runSetup() {
  try {
    console.log('📦 Step 1: Installing required dependencies...');
    execSync('npm install @prisma/client prisma uuid', { stdio: 'inherit' });
    
    console.log('\n🔧 Step 2: Setting up Prisma...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('\n📁 Step 3: Setting up environment file...');
    if (!fs.existsSync('.env')) {
      if (fs.existsSync('.env.example')) {
        fs.copyFileSync('.env.example', '.env');
        console.log('✅ Created .env file from .env.example');
      } else {
        const defaultEnv = `
# Backend Configuration
NODE_ENV=development
PORT=5001

# Database Configuration - UPDATE THIS WITH YOUR POSTGRES DETAILS
DATABASE_URL="postgresql://postgres:password@localhost:5432/email_productivity_agent"

# OpenRouter API
OPENROUTER_API_KEY=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

# Security
JWT_SECRET=your_jwt_secret_here
`;
        fs.writeFileSync('.env', defaultEnv);
        console.log('✅ Created default .env file');
      }
    } else {
      console.log('⚠️ .env file already exists');
    }
    
    console.log('\n🗃️ Step 4: Database setup instructions:');
    console.log('');
    console.log('🔹 Quick Docker Setup (Recommended):');
    console.log('   docker run --name email-postgres \\');
    console.log('     -e POSTGRES_DB=email_productivity_agent \\');
    console.log('     -e POSTGRES_USER=postgres \\');
    console.log('     -e POSTGRES_PASSWORD=password \\');
    console.log('     -p 5432:5432 -d postgres:15');
    console.log('');
    console.log('🔹 Then update your .env file with the correct DATABASE_URL');
    console.log('');
    console.log('🔹 Run migrations:');
    console.log('   npx prisma migrate dev --name init');
    console.log('');
    console.log('🔹 Load mock data:');
    console.log('   curl -X POST http://localhost:5001/api/emails-db/load-mock');
    
    console.log('\n✅ Setup complete! Follow the instructions above to finish database configuration.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

runSetup();