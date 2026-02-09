// ============================================
// DAILY LOGGING SYSTEM
// Creates a new log file for each day
// ============================================

const fs = require('fs');
const path = require('path');

// Logs directory
const LOGS_DIR = path.join(__dirname, '../../logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Get today's date formatted as YYYY-MM-DD
const getDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get current time formatted as HH:MM:SS
const getTimeString = () => {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Get log file path for today
const getLogFilePath = () => {
  return path.join(LOGS_DIR, `${getDateString()}.log`);
};

// Log levels
const LOG_LEVELS = {
  INFO: 'INFO',
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG'
};

// Write log entry to file
const writeLog = (level, category, message, details = {}) => {
  const timestamp = `${getDateString()} ${getTimeString()}`;
  const logFilePath = getLogFilePath();

  // Format details for readability
  let detailsStr = '';
  if (Object.keys(details).length > 0) {
    detailsStr = '\n    Details: ' + JSON.stringify(details, null, 2).replace(/\n/g, '\n    ');
  }

  const logEntry = `[${timestamp}] [${level}] [${category}] ${message}${detailsStr}\n`;

  // Also log to console with colors
  const colors = {
    INFO: '\x1b[36m',     // Cyan
    SUCCESS: '\x1b[32m',  // Green
    WARNING: '\x1b[33m',  // Yellow
    ERROR: '\x1b[31m',    // Red
    DEBUG: '\x1b[35m'     // Magenta
  };
  const reset = '\x1b[0m';
  console.log(`${colors[level] || ''}${logEntry}${reset}`);

  // Write to file
  fs.appendFileSync(logFilePath, logEntry);
};

// ============================================
// LOGGING FUNCTIONS BY CATEGORY
// ============================================

const logger = {
  // ----------------------------------------
  // AUTHENTICATION LOGS
  // ----------------------------------------
  auth: {
    login: (userType, email, tenantName, success, error = null) => {
      if (success) {
        writeLog(LOG_LEVELS.SUCCESS, 'AUTH',
          `${userType} "${email}" from tenant "${tenantName}" logged in successfully`);
      } else {
        writeLog(LOG_LEVELS.WARNING, 'AUTH',
          `Failed login attempt for ${userType} "${email}" from tenant "${tenantName}"`,
          { error: error || 'Invalid credentials' });
      }
    },

    logout: (userType, email, tenantName) => {
      writeLog(LOG_LEVELS.INFO, 'AUTH',
        `${userType} "${email}" from tenant "${tenantName}" logged out`);
    },

    tokenRefresh: (userType, email, tenantName, success) => {
      if (success) {
        writeLog(LOG_LEVELS.INFO, 'AUTH',
          `Token refreshed for ${userType} "${email}" from tenant "${tenantName}"`);
      } else {
        writeLog(LOG_LEVELS.WARNING, 'AUTH',
          `Failed token refresh for ${userType} "${email}" from tenant "${tenantName}"`);
      }
    },

    roomLogin: (roomName, tenantName, success, error = null) => {
      if (success) {
        writeLog(LOG_LEVELS.SUCCESS, 'AUTH',
          `Room "${roomName}" from tenant "${tenantName}" authenticated successfully`);
      } else {
        writeLog(LOG_LEVELS.WARNING, 'AUTH',
          `Failed room authentication for "${roomName}" from tenant "${tenantName}"`,
          { error: error || 'Invalid token' });
      }
    },

    superAdminLogin: (email, success, error = null) => {
      if (success) {
        writeLog(LOG_LEVELS.SUCCESS, 'AUTH',
          `Super Admin "${email}" logged in successfully`);
      } else {
        writeLog(LOG_LEVELS.WARNING, 'AUTH',
          `Failed Super Admin login attempt for "${email}"`,
          { error: error || 'Invalid credentials' });
      }
    }
  },

  // ----------------------------------------
  // USER MANAGEMENT LOGS
  // ----------------------------------------
  user: {
    create: (adminEmail, tenantName, newUserEmail, role, success, error = null) => {
      if (success) {
        writeLog(LOG_LEVELS.SUCCESS, 'USER',
          `Admin "${adminEmail}" from tenant "${tenantName}" created new ${role} user "${newUserEmail}"`);
      } else {
        writeLog(LOG_LEVELS.ERROR, 'USER',
          `Admin "${adminEmail}" from tenant "${tenantName}" failed to create ${role} user "${newUserEmail}"`,
          { error });
      }
    },

    update: (adminEmail, tenantName, targetUserEmail, changes, success, error = null) => {
      if (success) {
        writeLog(LOG_LEVELS.SUCCESS, 'USER',
          `Admin "${adminEmail}" from tenant "${tenantName}" updated user "${targetUserEmail}"`,
          { changes });
      } else {
        writeLog(LOG_LEVELS.ERROR, 'USER',
          `Admin "${adminEmail}" from tenant "${tenantName}" failed to update user "${targetUserEmail}"`,
          { error });
      }
    },

    delete: (adminEmail, tenantName, targetUserEmail, success, error = null) => {
      if (success) {
        writeLog(LOG_LEVELS.SUCCESS, 'USER',
          `Admin "${adminEmail}" from tenant "${tenantName}" deleted user "${targetUserEmail}"`);
      } else {
        writeLog(LOG_LEVELS.ERROR, 'USER',
          `Admin "${adminEmail}" from tenant "${tenantName}" failed to delete user "${targetUserEmail}"`,
          { error });
      }
    },

    passwordChange: (userEmail, tenantName, success, error = null) => {
      if (success) {
        writeLog(LOG_LEVELS.SUCCESS, 'USER',
          `User "${userEmail}" from tenant "${tenantName}" changed their password`);
      } else {
        writeLog(LOG_LEVELS.ERROR, 'USER',
          `User "${userEmail}" from tenant "${tenantName}" failed to change password`,
          { error });
      }
    },

    activate: (userEmail, tenantName, success, error = null) => {
      if (success) {
        writeLog(LOG_LEVELS.SUCCESS, 'USER',
          `User "${userEmail}" from tenant "${tenantName}" activated their account`);
      } else {
        writeLog(LOG_LEVELS.ERROR, 'USER',
          `User "${userEmail}" from tenant "${tenantName}" failed to activate account`,
          { error });
      }
    }
  },

  // ----------------------------------------
  // ORDER LOGS
  // ----------------------------------------
  order: {
    create: (roomName, tenantName, kitchenNumber, itemCount, orderId, success, error = null) => {
      if (success) {
        writeLog(LOG_LEVELS.SUCCESS, 'ORDER',
          `Room "${roomName}" from tenant "${tenantName}" placed order #${orderId} with ${itemCount} item(s) to Kitchen #${kitchenNumber}`);
      } else {
        writeLog(LOG_LEVELS.ERROR, 'ORDER',
          `Room "${roomName}" from tenant "${tenantName}" failed to place order to Kitchen #${kitchenNumber}`,
          { error });
      }
    },

    statusChange: (teaBoyEmail, tenantName, orderId, oldStatus, newStatus, roomName) => {
      writeLog(LOG_LEVELS.INFO, 'ORDER',
        `Tea Boy "${teaBoyEmail}" from tenant "${tenantName}" changed order #${orderId} status from "${oldStatus}" to "${newStatus}" (Room: ${roomName})`);
    },

    cancel: (teaBoyEmail, tenantName, orderId, roomName, reason) => {
      writeLog(LOG_LEVELS.WARNING, 'ORDER',
        `Tea Boy "${teaBoyEmail}" from tenant "${tenantName}" cancelled order #${orderId} from room "${roomName}"`,
        { reason });
    },

    clearHistory: (roomName, tenantName, deletedCount) => {
      writeLog(LOG_LEVELS.INFO, 'ORDER',
        `Room "${roomName}" from tenant "${tenantName}" cleared order history (${deletedCount} orders deleted)`);
    }
  },

  // ----------------------------------------
  // MENU LOGS
  // ----------------------------------------
  menu: {
    create: (teaBoyEmail, tenantName, itemName, kitchenNumber, success, error = null) => {
      if (success) {
        writeLog(LOG_LEVELS.SUCCESS, 'MENU',
          `Tea Boy "${teaBoyEmail}" from tenant "${tenantName}" added menu item "${itemName}" to Kitchen #${kitchenNumber}`);
      } else {
        writeLog(LOG_LEVELS.ERROR, 'MENU',
          `Tea Boy "${teaBoyEmail}" from tenant "${tenantName}" failed to add menu item "${itemName}"`,
          { error });
      }
    },

    update: (teaBoyEmail, tenantName, itemName, changes, success, error = null) => {
      if (success) {
        writeLog(LOG_LEVELS.SUCCESS, 'MENU',
          `Tea Boy "${teaBoyEmail}" from tenant "${tenantName}" updated menu item "${itemName}"`,
          { changes });
      } else {
        writeLog(LOG_LEVELS.ERROR, 'MENU',
          `Tea Boy "${teaBoyEmail}" from tenant "${tenantName}" failed to update menu item "${itemName}"`,
          { error });
      }
    },

    delete: (teaBoyEmail, tenantName, itemName, success, error = null) => {
      if (success) {
        writeLog(LOG_LEVELS.SUCCESS, 'MENU',
          `Tea Boy "${teaBoyEmail}" from tenant "${tenantName}" deleted menu item "${itemName}"`);
      } else {
        writeLog(LOG_LEVELS.ERROR, 'MENU',
          `Tea Boy "${teaBoyEmail}" from tenant "${tenantName}" failed to delete menu item "${itemName}"`,
          { error });
      }
    },

    toggleAvailability: (teaBoyEmail, tenantName, itemName, available) => {
      writeLog(LOG_LEVELS.INFO, 'MENU',
        `Tea Boy "${teaBoyEmail}" from tenant "${tenantName}" marked menu item "${itemName}" as ${available ? 'AVAILABLE' : 'UNAVAILABLE'}`);
    }
  },

  // ----------------------------------------
  // ROOM LOGS
  // ----------------------------------------
  room: {
    create: (adminEmail, tenantName, roomName, kitchenNumber, success, error = null) => {
      if (success) {
        writeLog(LOG_LEVELS.SUCCESS, 'ROOM',
          `Admin "${adminEmail}" from tenant "${tenantName}" created room "${roomName}" assigned to Kitchen #${kitchenNumber}`);
      } else {
        writeLog(LOG_LEVELS.ERROR, 'ROOM',
          `Admin "${adminEmail}" from tenant "${tenantName}" failed to create room "${roomName}"`,
          { error });
      }
    },

    update: (adminEmail, tenantName, roomName, changes, success, error = null) => {
      if (success) {
        writeLog(LOG_LEVELS.SUCCESS, 'ROOM',
          `Admin "${adminEmail}" from tenant "${tenantName}" updated room "${roomName}"`,
          { changes });
      } else {
        writeLog(LOG_LEVELS.ERROR, 'ROOM',
          `Admin "${adminEmail}" from tenant "${tenantName}" failed to update room "${roomName}"`,
          { error });
      }
    },

    delete: (adminEmail, tenantName, roomName, success, error = null) => {
      if (success) {
        writeLog(LOG_LEVELS.SUCCESS, 'ROOM',
          `Admin "${adminEmail}" from tenant "${tenantName}" deleted room "${roomName}"`);
      } else {
        writeLog(LOG_LEVELS.ERROR, 'ROOM',
          `Admin "${adminEmail}" from tenant "${tenantName}" failed to delete room "${roomName}"`,
          { error });
      }
    },

    generateToken: (adminEmail, tenantName, roomName) => {
      writeLog(LOG_LEVELS.INFO, 'ROOM',
        `Admin "${adminEmail}" from tenant "${tenantName}" generated new access token for room "${roomName}"`);
    }
  },

  // ----------------------------------------
  // KITCHEN LOGS
  // ----------------------------------------
  kitchen: {
    create: (adminEmail, tenantName, kitchenName, kitchenNumber, success, error = null) => {
      if (success) {
        writeLog(LOG_LEVELS.SUCCESS, 'KITCHEN',
          `Admin "${adminEmail}" from tenant "${tenantName}" created kitchen "${kitchenName}" (#${kitchenNumber})`);
      } else {
        writeLog(LOG_LEVELS.ERROR, 'KITCHEN',
          `Admin "${adminEmail}" from tenant "${tenantName}" failed to create kitchen "${kitchenName}"`,
          { error });
      }
    },

    update: (adminEmail, tenantName, kitchenName, changes, success, error = null) => {
      if (success) {
        writeLog(LOG_LEVELS.SUCCESS, 'KITCHEN',
          `Admin "${adminEmail}" from tenant "${tenantName}" updated kitchen "${kitchenName}"`,
          { changes });
      } else {
        writeLog(LOG_LEVELS.ERROR, 'KITCHEN',
          `Admin "${adminEmail}" from tenant "${tenantName}" failed to update kitchen "${kitchenName}"`,
          { error });
      }
    },

    delete: (adminEmail, tenantName, kitchenName, success, error = null) => {
      if (success) {
        writeLog(LOG_LEVELS.SUCCESS, 'KITCHEN',
          `Admin "${adminEmail}" from tenant "${tenantName}" deleted kitchen "${kitchenName}"`);
      } else {
        writeLog(LOG_LEVELS.ERROR, 'KITCHEN',
          `Admin "${adminEmail}" from tenant "${tenantName}" failed to delete kitchen "${kitchenName}"`,
          { error });
      }
    }
  },

  // ----------------------------------------
  // TENANT LOGS (Super Admin)
  // ----------------------------------------
  tenant: {
    create: (superAdminEmail, tenantName, adminEmail, success, error = null) => {
      if (success) {
        writeLog(LOG_LEVELS.SUCCESS, 'TENANT',
          `Super Admin "${superAdminEmail}" created new tenant "${tenantName}" with admin "${adminEmail}"`);
      } else {
        writeLog(LOG_LEVELS.ERROR, 'TENANT',
          `Super Admin "${superAdminEmail}" failed to create tenant "${tenantName}"`,
          { error });
      }
    },

    update: (superAdminEmail, tenantName, changes, success, error = null) => {
      if (success) {
        writeLog(LOG_LEVELS.SUCCESS, 'TENANT',
          `Super Admin "${superAdminEmail}" updated tenant "${tenantName}"`,
          { changes });
      } else {
        writeLog(LOG_LEVELS.ERROR, 'TENANT',
          `Super Admin "${superAdminEmail}" failed to update tenant "${tenantName}"`,
          { error });
      }
    },

    delete: (superAdminEmail, tenantName, success, error = null) => {
      if (success) {
        writeLog(LOG_LEVELS.SUCCESS, 'TENANT',
          `Super Admin "${superAdminEmail}" deleted tenant "${tenantName}"`);
      } else {
        writeLog(LOG_LEVELS.ERROR, 'TENANT',
          `Super Admin "${superAdminEmail}" failed to delete tenant "${tenantName}"`,
          { error });
      }
    },

    toggleStatus: (superAdminEmail, tenantName, isActive) => {
      writeLog(LOG_LEVELS.INFO, 'TENANT',
        `Super Admin "${superAdminEmail}" ${isActive ? 'ACTIVATED' : 'DEACTIVATED'} tenant "${tenantName}"`);
    }
  },

  // ----------------------------------------
  // SYSTEM LOGS
  // ----------------------------------------
  system: {
    start: (port) => {
      writeLog(LOG_LEVELS.SUCCESS, 'SYSTEM',
        `Server started successfully on port ${port}`);
    },

    shutdown: () => {
      writeLog(LOG_LEVELS.INFO, 'SYSTEM',
        `Server shutting down...`);
    },

    error: (message, error) => {
      writeLog(LOG_LEVELS.ERROR, 'SYSTEM',
        message, { error: error?.message || error });
    },

    dbConnection: (success, error = null) => {
      if (success) {
        writeLog(LOG_LEVELS.SUCCESS, 'SYSTEM',
          `Database connection established successfully`);
      } else {
        writeLog(LOG_LEVELS.ERROR, 'SYSTEM',
          `Database connection failed`, { error });
      }
    },

    socketConnection: (roomId, type) => {
      writeLog(LOG_LEVELS.DEBUG, 'SOCKET',
        `${type === 'join' ? 'Client joined' : 'Client left'} room channel: ${roomId}`);
    }
  },

  // ----------------------------------------
  // API REQUEST LOGS
  // ----------------------------------------
  api: {
    request: (method, path, userEmail, tenantName, statusCode, duration) => {
      const level = statusCode >= 500 ? LOG_LEVELS.ERROR :
                   statusCode >= 400 ? LOG_LEVELS.WARNING :
                   LOG_LEVELS.INFO;

      writeLog(level, 'API',
        `${method} ${path} - ${statusCode} (${duration}ms)`,
        { user: userEmail || 'Anonymous', tenant: tenantName || 'N/A' });
    }
  }
};

module.exports = logger;
