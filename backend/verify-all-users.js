// Script to verify all users' emails
const { prisma } = require('./src/lib/prisma.js');

async function verifyAllUsers() {
  try {
    console.log('🔄 Verifying all users...');

    const result = await prisma.user.updateMany({
      where: {
        emailVerified: false
      },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date()
      }
    });

    console.log(`✅ Successfully verified ${result.count} users!`);

    // Show all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        tenant: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });

    console.log('\n📋 All users:');
    allUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - ${user.role} - Verified: ${user.emailVerified} - Tenant: ${user.tenant.name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAllUsers();
