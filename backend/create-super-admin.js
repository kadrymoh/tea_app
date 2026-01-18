require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function createSuperAdmin() {
  try {
    console.log('Creating Super Admin...');

    const email = 'krefaei@twaasol.com';
    const password = 'Admin@12345';  // ⚠️ Change this after first login!
    const name = 'Super Administrator';
  

    // Check if super admin exists
    const existing = await prisma.superAdmin.findUnique({
      where: { email }
    });

    if (existing) {
      console.log('⚠️  Super Admin already exists. Activating account...\n');

      // Update existing account to activate it
      const updated = await prisma.superAdmin.update({
        where: { email },
        data: {
          isActive: true,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          role: 'SUPER_ADMIN'
        }
      });

      console.log('✅ Super Admin account activated successfully!\n');
      console.log('📧 Email:', updated.email);
      console.log('👤 Name:', updated.name);
      console.log('🆔 ID:', updated.id);
      console.log('✅ Active:', updated.isActive);
      console.log('✅ Email Verified:', updated.emailVerified);
      console.log('✅ Role:', updated.role);
      console.log('\n🚀 Login URL: https://teaapp.twaasol.com/super-admin');
      console.log('💡 Account is now ready to use!\n');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create super admin with full activation
    const superAdmin = await prisma.superAdmin.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name,
        role: 'SUPER_ADMIN',
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: true
        }
      }
    });

    console.log('\n✅ Super Admin created successfully!\n');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('🆔 ID:', superAdmin.id);
    console.log('✅ Active:', superAdmin.isActive);
    console.log('✅ Email Verified:', superAdmin.emailVerified);
    console.log('✅ Role:', superAdmin.role);
    console.log('\n🚀 Login URL: https://teaapp.twaasol.com/super-admin');
    console.log('💡 No email activation needed - Account is ready to use!');
    console.log('\n⚠️  IMPORTANT: Change this password after first login!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

createSuperAdmin();
