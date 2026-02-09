// backend/src/middleware/tenant.middleware.js
const { prisma } = require('../lib/prisma.js');

/**
 * Middleware to inject tenant-filtered Prisma client
 */
const injectTenantContext = async (req, res, next) => {
  try {
    if (!req.user?.tenantId) {
      console.error('❌ No tenantId in request user:', req.user);
      return res.status(400).json({
        success: false,
        error: 'No tenant context found',
        message: 'User must belong to a tenant'
      });
    }

    const tenantId = req.user.tenantId;
    console.log('✅ Tenant Context Injected:', tenantId, 'for user:', req.user.email);

    // Get tenant name for logging
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true }
    });
    req.tenantName = tenant?.name || 'Unknown';

    // Create Prisma client extension with automatic tenant filtering
    req.tenantPrisma = prisma.$extends({
      query: {
        // Apply to all models
        $allModels: {
          // Apply to all operations
          async $allOperations({ args, query, model, operation }) {
            // Models that should be filtered by tenant
            const tenantModels = [
              'User',
              'Kitchen',
              'Room',
              'RoomDevice',
              'MenuItem',
              'Order',
              'OrderItem',
              'AuditLog',
              'AuthSession'
            ];

            if (tenantModels.includes(model)) {
              console.log(`🔍 Filtering ${model}.${operation} with tenantId:`, tenantId);

              // ⭐ CRITICAL FIX: Handle findUnique specially
              // findUnique requires unique fields, so we convert it to findFirst
              if (operation === 'findUnique' || operation === 'findUniqueOrThrow') {
                console.log(`  🔄 Converting ${operation} to findFirst for tenant filtering`);

                // Convert findUnique to findFirst and add tenantId
                if (!args.where) {
                  args.where = {};
                }
                args.where.tenantId = tenantId;

                // Use findFirst instead
                const result = await prisma[model].findFirst(args);

                // Throw error if findUniqueOrThrow and no result
                if (operation === 'findUniqueOrThrow' && !result) {
                  throw new Error(`No ${model} found`);
                }

                return result;
              }

              // ⭐ For READ operations: inject tenantId into where clause
              const readOperations = ['findMany', 'findFirst', 'findFirstOrThrow', 'count', 'aggregate', 'groupBy'];
              if (readOperations.includes(operation)) {
                if (!args.where) {
                  args.where = {};
                }
                args.where.tenantId = tenantId;
                console.log(`  📋 WHERE clause:`, args.where);
              }

              // ⭐ For UPDATE/DELETE operations: inject tenantId into where clause
              const writeWithWhereOperations = ['update', 'updateMany', 'delete', 'deleteMany', 'upsert'];
              if (writeWithWhereOperations.includes(operation)) {
                if (!args.where) {
                  args.where = {};
                }
                args.where.tenantId = tenantId;
                console.log(`  📋 WHERE clause:`, args.where);
              }

              // ⭐ For CREATE operations: inject tenantId into data ONLY
              const createOperations = ['create', 'createMany'];
              if (createOperations.includes(operation)) {
                // Inject tenantId into data for create operations
                if ('data' in args && args.data && typeof args.data === 'object' && !Array.isArray(args.data)) {
                  args.data = { ...args.data, tenantId };
                  console.log(`  ➕ CREATE data with tenantId`);
                }

                // For createMany, inject into each item
                if ('data' in args && args.data && Array.isArray(args.data)) {
                  args.data = args.data.map((item) => ({
                    ...item,
                    tenantId
                  }));
                  console.log(`  ➕ CREATE MANY with tenantId`);
                }
              }

              // ⭐ For UPDATE operations: also inject into data
              if (operation === 'update' || operation === 'updateMany' || operation === 'upsert') {
                if ('data' in args && args.data && typeof args.data === 'object' && !Array.isArray(args.data)) {
                  // Don't overwrite if already set
                  if (!args.data.tenantId) {
                    args.data.tenantId = tenantId;
                  }
                  console.log(`  ✏️ UPDATE data ensured tenantId`);
                }
              }
            }

            return query(args);
          }
        }
      }
    });

    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Tenant context error',
      message: 'Failed to establish tenant context'
    });
  }
};

/**
 * Middleware to verify tenant is active
 */
const verifyTenantActive = async (req, res, next) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'No tenant found'
      });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    if (!tenant.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Tenant account is inactive',
        message: 'Please contact support to reactivate your account'
      });
    }

    next();
  } catch (error) {
    console.error('Tenant verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Tenant verification failed'
    });
  }
};

/**
 * Extract tenant from subdomain (optional feature)
 */
const extractTenantFromSubdomain = (req, res, next) => {
  const host = req.get('host') || '';
  const subdomain = host.split('.')[0];

  // Skip for localhost and common subdomains
  if (
    host.includes('localhost') ||
    subdomain === 'www' ||
    subdomain === 'api' ||
    subdomain === host
  ) {
    next();
    return;
  }

  // Attach subdomain to request for later use
  req.tenantSlug = subdomain;
  next();
};

module.exports = {
  injectTenantContext,
  verifyTenantActive,
  extractTenantFromSubdomain
};