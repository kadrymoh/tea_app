#!/usr/bin/env node
/**
 * Script to delete all TEA_BOY users from the database
 *
 * This script is needed after migrating to kitchen-based authentication
 * where each kitchen has its own username/password instead of individual tea boy users.
 *
 * Usage:
 *   cd backend
 *   node scripts/delete-teaboy-users.js
 *
 * Or with preview (dry run):
 *   node scripts/delete-teaboy-users.js --dry-run
 */

const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  log('blue', '==========================================');
  log('blue', 'Delete Tea Boy Users Script');
  log('blue', '==========================================');
  console.log('');

  if (isDryRun) {
    log('yellow', '⚠️  DRY RUN MODE - No changes will be made');
    console.log('');
  }

  try {
    // Find all TEA_BOY users
    const teaBoyUsers = await prisma.user.findMany({
      where: {
        role: 'TEA_BOY'
      },
      include: {
        tenant: {
          select: {
            name: true,
            slug: true
          }
        },
        kitchen: {
          select: {
            name: true
          }
        }
      }
    });

    if (teaBoyUsers.length === 0) {
      log('green', '✅ No Tea Boy users found in the database.');
      log('green', 'Nothing to delete!');
      return;
    }

    log('yellow', `Found ${teaBoyUsers.length} Tea Boy user(s):`);
    console.log('');

    // Display users to be deleted
    teaBoyUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Tenant: ${user.tenant.name} (${user.tenant.slug})`);
      console.log(`     Kitchen: ${user.kitchen?.name || 'N/A'}`);
      console.log(`     Created: ${user.createdAt.toLocaleDateString()}`);
      console.log('');
    });

    if (isDryRun) {
      log('yellow', '⚠️  DRY RUN - These users would be deleted.');
      log('blue', 'Run without --dry-run to actually delete them.');
      return;
    }

    // Ask for confirmation
    console.log('');
    log('red', '⚠️  WARNING: This action cannot be undone!');
    console.log('');

    const confirmed = await askConfirmation('Type "yes" to confirm deletion: ');

    if (!confirmed) {
      log('yellow', 'Operation cancelled.');
      return;
    }

    console.log('');
    log('blue', 'Deleting Tea Boy users...');

    // Delete auth sessions first (foreign key constraint)
    const deletedSessions = await prisma.authSession.deleteMany({
      where: {
        userId: {
          in: teaBoyUsers.map(u => u.id)
        }
      }
    });
    console.log(`  - Deleted ${deletedSessions.count} auth sessions`);

    // Delete the users
    const deleted = await prisma.user.deleteMany({
      where: {
        role: 'TEA_BOY'
      }
    });

    console.log(`  - Deleted ${deleted.count} Tea Boy users`);

    console.log('');
    log('green', '==========================================');
    log('green', `✅ Successfully deleted ${deleted.count} Tea Boy user(s)`);
    log('green', '==========================================');
    console.log('');
    log('blue', 'Next steps:');
    console.log('  1. Create kitchen credentials in Admin Panel');
    console.log('  2. Share kitchen username/password with staff');
    console.log('  3. Staff can login at: /tenant/kitchen');

  } catch (error) {
    log('red', '❌ Error:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
