import { sql } from '@vercel/postgres';

async function createUsersTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      "passwordHash" VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      phone VARCHAR(50),
      nid VARCHAR(50),
      verified BOOLEAN DEFAULT false,
      banned BOOLEAN DEFAULT false,
      skills TEXT[],
      bio TEXT,
      avatar VARCHAR(255),
      rating NUMERIC(3, 2) DEFAULT 0,
      "ratingCount" INTEGER DEFAULT 0,
      earnings NUMERIC(10, 2) DEFAULT 0,
      location JSONB,
      "createdAt" BIGINT NOT NULL,
      "resetToken" VARCHAR(255),
      "resetTokenExpires" BIGINT
    );
  `;
}

async function createJobsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS jobs (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      budget NUMERIC(10, 2) DEFAULT 0,
      deadline VARCHAR(255),
      location JSONB,
      "createdBy" VARCHAR(255) REFERENCES users(id),
      "assignedTo" VARCHAR(255) REFERENCES users(id),
      status VARCHAR(50) NOT NULL,
      applications JSONB,
      reviews JSONB,
      "createdAt" BIGINT NOT NULL
    );
  `;
}

async function createConversationsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS conversations (
      id VARCHAR(255) PRIMARY KEY,
      participants VARCHAR(255)[] NOT NULL,
      "jobId" VARCHAR(255) REFERENCES jobs(id),
      "createdAt" BIGINT NOT NULL
    );
  `;
}

async function createMessagesTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR(255) PRIMARY KEY,
      "conversationId" VARCHAR(255) REFERENCES conversations(id),
      "from" VARCHAR(255) REFERENCES users(id),
      text TEXT NOT NULL,
      "createdAt" BIGINT NOT NULL
    );
  `;
}

async function createPushSubscriptionsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id SERIAL PRIMARY KEY,
      "userId" VARCHAR(255) REFERENCES users(id),
      subscription JSONB NOT NULL,
      "createdAt" BIGINT NOT NULL
    );
  `;
}

async function createNotificationsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(255) PRIMARY KEY,
      "userId" VARCHAR(255) REFERENCES users(id),
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      url VARCHAR(255),
      read BOOLEAN DEFAULT false,
      "createdAt" BIGINT NOT NULL
    );
  `;
}

async function main() {
  console.log('Setting up database...');
  await createUsersTable();
  await createJobsTable();
  await createConversationsTable();
  await createMessagesTable();
  await createPushSubscriptionsTable();
  await createNotificationsTable();
  console.log('Database setup complete.');
}

main().catch(err => {
  console.error('Error setting up database:', err);
  process.exit(1);
});
