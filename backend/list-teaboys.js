// List all Tea Boy users
const { prisma } = require('./src/lib/prisma.js');

async function listTeaBoys() {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'TEA_BOY' },
      select: {
        email: true,
        name: true,
        emailVerified: true,
        isActive: true,
        tenant: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });

    console.log('\n🍵 Tea Boy Users:');
    console.log('==================');
    users.forEach(u => {
      console.log(`\nName: ${u.name}`);
      console.log(`Email: ${u.email}`);
      console.log(`Verified: ${u.emailVerified ? '✅' : '❌'}`);
      console.log(`Active: ${u.isActive ? '✅' : '❌'}`);
      console.log(`Tenant: ${u.tenant.name} (${u.tenant.slug})`);
    });

    console.log('\n==================\n');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listTeaBoys();
