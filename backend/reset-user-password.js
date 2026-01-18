// Reset password for a specific user
const { prisma } = require('./src/lib/prisma.js');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  try {
    const email = 'gf@s.com'; // Change this to the user email
    const newPassword = 'password123'; // Change this to your desired password

    console.log(`🔄 Resetting password for: ${email}`);

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    const user = await prisma.user.updateMany({
      where: { email },
      data: { passwordHash }
    });

    if (user.count === 0) {
      console.log('❌ User not found');
    } else {
      console.log(`✅ Password reset successful!`);
      console.log(`\n📋 Login Credentials:`);
      console.log(`Email: ${email}`);
      console.log(`Password: ${newPassword}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
