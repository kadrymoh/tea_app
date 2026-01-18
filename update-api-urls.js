#!/usr/bin/env node

/**
 * Script to update all localhost:4000 references to use API_CONFIG
 * This script will update all frontend files to use the centralized API configuration
 */

const fs = require('fs');
const path = require('path');

// Directories to process
const frontendApps = [
  'frontend/super-admin-web/src',
  'frontend/admin-web/src',
  'frontend/tea-boy-web/src',
  'frontend/meeting-room-web/src'
];

// Patterns to replace
const replacements = [
  {
    // Standard API calls
    pattern: /fetch\(['"]http:\/\/localhost:4000\/api\/([^'"]+)['"]/g,
    replacement: "fetch(getApiUrl('$1')"
  },
  {
    // API calls without /api prefix
    pattern: /fetch\(['"]http:\/\/localhost:4000\/([^'"]+)['"]/g,
    replacement: "fetch(getApiUrl('$1')"
  },
  {
    // Socket.IO connections
    pattern: /io\(['"]http:\/\/localhost:4000['"]/g,
    replacement: "io(API_CONFIG.SOCKET_URL"
  },
  {
    // Direct URL references
    pattern: /'http:\/\/localhost:4000\/api\/([^']+)'/g,
    replacement: "getApiUrl('$1')"
  },
  {
    // Direct URL references with double quotes
    pattern: /"http:\/\/localhost:4000\/api\/([^"]+)"/g,
    replacement: "getApiUrl('$1')"
  }
];

// Files to skip
const skipFiles = [
  'node_modules',
  'dist',
  'build',
  '.git',
  'update-api-urls.js'
];

function shouldSkipFile(filePath) {
  return skipFiles.some(skip => filePath.includes(skip));
}

function processFile(filePath) {
  if (shouldSkipFile(filePath)) return false;

  // Only process .js, .jsx, .ts, .tsx files
  const ext = path.extname(filePath);
  if (!['.js', '.jsx', '.ts', '.tsx'].includes(ext)) return false;

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let needsImport = false;

  // Apply replacements
  replacements.forEach(({ pattern, replacement }) => {
    const newContent = content.replace(pattern, replacement);
    if (newContent !== content) {
      content = newContent;
      modified = true;
      needsImport = true;
    }
  });

  if (modified) {
    // Check if file already has the import
    const hasGetApiUrl = content.includes("from '../config/api.config'") ||
                         content.includes('from "../config/api.config"') ||
                         content.includes("from '../../config/api.config'") ||
                         content.includes('from "../../config/api.config"');

    const hasApiConfig = content.includes('API_CONFIG');

    // Add import if needed and not present
    if (needsImport && (!hasGetApiUrl || (content.includes('API_CONFIG.SOCKET_URL') && !hasApiConfig))) {
      // Determine correct import path depth
      const depth = filePath.split(path.sep).filter(p => p === 'src').length > 0 ?
        (filePath.split(path.sep).indexOf('src') < filePath.split(path.sep).length - 2 ? '../' : '') : '';

      // Find the last import statement
      const importRegex = /^import .+ from .+;$/gm;
      const imports = content.match(importRegex);

      if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const importToAdd = content.includes('API_CONFIG.SOCKET_URL') ?
          `import { API_CONFIG, getApiUrl } from '${depth}../config/api.config';` :
          `import { getApiUrl } from '${depth}../config/api.config';`;

        // Don't add if already present
        if (!content.includes(importToAdd)) {
          content = content.replace(lastImport, lastImport + '\n' + importToAdd);
        }
      }
    }

    // Write back
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
    return true;
  }

  return false;
}

function walkDirectory(dir) {
  let updatedCount = 0;

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!shouldSkipFile(filePath)) {
        updatedCount += walkDirectory(filePath);
      }
    } else {
      if (processFile(filePath)) {
        updatedCount++;
      }
    }
  });

  return updatedCount;
}

// Main execution
console.log('🔄 Starting API URL update process...\n');

let totalUpdated = 0;

frontendApps.forEach(appDir => {
  const fullPath = path.join(__dirname, appDir);

  if (fs.existsSync(fullPath)) {
    console.log(`📁 Processing: ${appDir}`);
    const count = walkDirectory(fullPath);
    totalUpdated += count;
    console.log(`   Updated ${count} files\n`);
  } else {
    console.log(`⚠️  Directory not found: ${appDir}\n`);
  }
});

console.log(`\n✨ Complete! Updated ${totalUpdated} files total.`);
console.log('\n📝 Next steps:');
console.log('1. Review the changes with: git diff');
console.log('2. Test each application');
console.log('3. Update .env files with production URLs');
console.log('4. Build for production: npm run build');
