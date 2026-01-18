// backend/src/jobs/orderHistoryCleaner.js
const cron = require('node-cron');
const { prisma } = require('../lib/prisma');

/**
 * Auto-clear order history based on tenant settings
 * Runs every minute to check if any tenant needs history cleanup
 */
const startOrderHistoryCleaner = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      // Get all tenants with auto-clear enabled
      const tenants = await prisma.tenant.findMany({
        where: {
          autoClearHistoryEnabled: true,
          autoClearHistoryInterval: {
            not: null
          }
        },
        select: {
          id: true,
          name: true,
          autoClearHistoryInterval: true
        }
      });

      if (tenants.length === 0) {
        return; // No tenants need cleanup
      }

      console.log(`🧹 Checking ${tenants.length} tenant(s) for order history cleanup...`);

      for (const tenant of tenants) {
        try {
          // Calculate the cutoff time based on interval
          const intervalMinutes = tenant.autoClearHistoryInterval;
          const cutoffTime = new Date();
          cutoffTime.setMinutes(cutoffTime.getMinutes() - intervalMinutes);

          // Delete DELIVERED orders older than the interval
          const result = await prisma.order.deleteMany({
            where: {
              tenantId: tenant.id,
              status: 'DELIVERED',
              updatedAt: {
                lt: cutoffTime
              }
            }
          });

          if (result.count > 0) {
            console.log(`✅ Cleaned ${result.count} old order(s) for tenant "${tenant.name}" (older than ${intervalMinutes} minutes)`);
          }
        } catch (error) {
          console.error(`❌ Error cleaning orders for tenant "${tenant.name}":`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ Error in order history cleaner:', error);
    }
  });

  console.log('✅ Order history cleaner started (runs every minute)');
};

module.exports = { startOrderHistoryCleaner };
