import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

async function migrateUsers(users) {
  console.log('Migrating users...');
  for (const user of users) {
    await sql`
      INSERT INTO users (id, name, email, "passwordHash", role, phone, nid, verified, banned, skills, bio, avatar, rating, "ratingCount", earnings, location, "createdAt", "resetToken", "resetTokenExpires")
      VALUES (${user.id}, ${user.name}, ${user.email}, ${user.passwordHash}, ${user.role}, ${user.phone}, ${user.nid}, ${user.verified}, ${user.banned}, ${user.skills}, ${user.bio}, ${user.avatar}, ${user.rating}, ${user.ratingCount}, ${user.earnings}, ${JSON.stringify(user.location)}, ${user.createdAt}, ${user.resetToken}, ${user.resetTokenExpires})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
  console.log('Users migrated.');
}

async function migrateJobs(jobs) {
  console.log('Migrating jobs...');
  for (const job of jobs) {
    await sql`
      INSERT INTO jobs (id, title, description, budget, deadline, location, "createdBy", "assignedTo", status, applications, reviews, "createdAt")
      VALUES (${job.id}, ${job.title}, ${job.description}, ${job.budget}, ${job.deadline}, ${JSON.stringify(job.location)}, ${job.createdBy}, ${job.assignedTo}, ${job.status}, ${JSON.stringify(job.applications)}, ${JSON.stringify(job.reviews)}, ${job.createdAt})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
  console.log('Jobs migrated.');
}

async function migrateConversations(conversations) {
  console.log('Migrating conversations...');
  for (const conversation of conversations) {
    await sql`
      INSERT INTO conversations (id, participants, "jobId", "createdAt")
      VALUES (${conversation.id}, ${conversation.participants}, ${conversation.jobId}, ${conversation.createdAt})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
  console.log('Conversations migrated.');
}

async function migrateMessages(messages) {
  console.log('Migrating messages...');
  for (const message of messages) {
    await sql`
      INSERT INTO messages (id, "conversationId", "from", text, "createdAt")
      VALUES (${message.id}, ${message.conversationId}, ${message.from}, ${message.text}, ${message.createdAt})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
  console.log('Messages migrated.');
}

async function migratePushSubscriptions(pushSubs) {
  console.log('Migrating push subscriptions...');
  for (const sub of pushSubs) {
    await sql`
      INSERT INTO push_subscriptions ("userId", subscription, "createdAt")
      VALUES (${sub.userId}, ${JSON.stringify(sub.subscription)}, ${sub.createdAt});
    `;
  }
  console.log('Push subscriptions migrated.');
}

async function migrateNotifications(notifications) {
  console.log('Migrating notifications...');
  for (const notification of notifications) {
    await sql`
      INSERT INTO notifications (id, "userId", type, title, body, url, read, "createdAt")
      VALUES (${notification.id}, ${notification.userId}, ${notification.type}, ${notification.title}, ${notification.body}, ${notification.url}, ${notification.read}, ${notification.createdAt})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
  console.log('Notifications migrated.');
}

async function main() {
  const dbData = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

  await migrateUsers(dbData.users || []);
  await migrateJobs(dbData.jobs || []);
  await migrateConversations(dbData.conversations || []);
  await migrateMessages(dbData.messages || []);
  await migratePushSubscriptions(dbData.pushSubs || []);
  await migrateNotifications(dbData.notifications || []);

  console.log('Data migration complete.');
}

main().catch(err => {
  console.error('Error migrating data:', err);
  process.exit(1);
});
