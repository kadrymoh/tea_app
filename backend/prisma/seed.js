// backend/prisma/seed.js
require('dotenv').config();
const { PrismaClient, UserRole, MenuCategory } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");

// Initialize Prisma with PostgreSQL adapter (Prisma 7)
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // 1️⃣ Create Demo Tenant
  console.log('📦 Creating tenant...');
  const tenant = await prisma.tenant.create({
    data: {
      name: "Demo Company",
      slug: "demo-company",
      domain: "demo.local",
      isActive: true
    }
  });
  console.log('✅ Tenant created:', tenant.slug);

  // 2️⃣ Create Admin User
  console.log('👤 Creating admin user...');
  const adminPasswordHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: "System Admin",
      email: "admin@demo.com",
      role: UserRole.ADMIN,
      passwordHash: adminPasswordHash,
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date()
    }
  });
  console.log('✅ Admin user created:', admin.email);

  // 3️⃣ Create Kitchens
  console.log('🍳 Creating kitchens...');
  const kitchen1 = await prisma.kitchen.create({
    data: {
      tenantId: tenant.id,
      name: 'Kitchen Floor 1',
      building: 'Main Building',
      floor: 1,
      isActive: true
    }
  });

  const kitchen2 = await prisma.kitchen.create({
    data: {
      tenantId: tenant.id,
      name: 'Kitchen Floor 2-3',
      building: 'Main Building',
      floor: 2,
      isActive: true
    }
  });
  console.log('✅ Kitchens created');

  // 4️⃣ Create Tea Boy Users
  console.log('☕ Creating tea boy users...');
  const teaBoyPasswordHash = await bcrypt.hash("teaboy123", 10);

  const teaBoy1 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Ahmed Ali',
      email: 'ahmed@demo.com',
      phone: '+971501234567',
      kitchenId: kitchen1.id,
      role: UserRole.TEA_BOY,
      passwordHash: teaBoyPasswordHash,
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date()
    }
  });

  const teaBoy2 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Mohammed Hassan',
      email: 'mohammed@demo.com',
      phone: '+971501234568',
      kitchenId: kitchen2.id,
      role: UserRole.TEA_BOY,
      passwordHash: teaBoyPasswordHash,
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date()
    }
  });
  console.log('✅ Tea boy users created');

  // 5️⃣ Create Rooms
  console.log('🚪 Creating rooms...');
  await prisma.room.createMany({
    data: [
      {
        tenantId: tenant.id,
        name: 'Meeting Room A',
        building: 'Main Building',
        floor: 1,
        capacity: 10,
        kitchenId: kitchen1.id,
        isActive: true
      },
      {
        tenantId: tenant.id,
        name: 'Conference Room B',
        building: 'Main Building',
        floor: 1,
        capacity: 20,
        kitchenId: kitchen1.id,
        isActive: true
      },
      {
        tenantId: tenant.id,
        name: 'Board Room',
        building: 'Main Building',
        floor: 2,
        capacity: 15,
        kitchenId: kitchen2.id,
        isActive: true
      }
    ]
  });
  console.log('✅ Rooms created');

  // 6️⃣ Create Menu Items
  console.log('📋 Creating menu items...');
  await prisma.menuItem.createMany({
    data: [
      {
        tenantId: tenant.id,
        name: 'Karak Tea',
        nameAr: 'شاي كرك',
        category: MenuCategory.HOT_TEA,
        price: 2.00,
        emoji: '🫖',
        available: true
      },
      {
        tenantId: tenant.id,
        name: 'Espresso',
        nameAr: 'إسبريسو',
        category: MenuCategory.COFFEE,
        price: 3.50,
        emoji: '☕',
        available: true
      },
      {
        tenantId: tenant.id,
        name: 'Orange Juice',
        nameAr: 'عصير برتقال',
        category: MenuCategory.JUICE,
        price: 4.50,
        emoji: '🍊',
        available: true
      },
      {
        tenantId: tenant.id,
        name: 'Cappuccino',
        nameAr: 'كابتشينو',
        category: MenuCategory.COFFEE,
        price: 4.00,
        emoji: '☕',
        available: true
      },
      {
        tenantId: tenant.id,
        name: 'Green Tea',
        nameAr: 'شاي أخضر',
        category: MenuCategory.HOT_TEA,
        price: 2.50,
        emoji: '🍵',
        available: true
      },
      {
        tenantId: tenant.id,
        name: 'Water',
        nameAr: 'ماء',
        category: MenuCategory.WATER,
        price: 1.00,
        emoji: '💧',
        available: true
      }
    ]
  });
  console.log('✅ Menu items created');

  console.log('\n✨ Seed completed successfully!\n');
  console.log('📝 Login Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👨‍💼 Admin:');
  console.log('   Email: admin@demo.com');
  console.log('   Password: admin123');
  console.log('');
  console.log('☕ Tea Boy 1:');
  console.log('   Email: ahmed@demo.com');
  console.log('   Password: teaboy123');
  console.log('');
  console.log('☕ Tea Boy 2:');
  console.log('   Email: mohammed@demo.com');
  console.log('   Password: teaboy123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });