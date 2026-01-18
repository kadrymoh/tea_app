// frontend/admin-web/src/utils/tenant.js

/**
 * Extract tenant slug from subdomain or path
 *
 * Examples:
 * - company-a.localhost:5173 → "company-a"
 * - localhost:5173/company-a/admin → "company-a"
 * - myapp.com/company-a/admin → "company-a"
 */
export const getTenantSlug = () => {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  // Strategy 1: Subdomain-based (for production)
  // company-a.myapp.com → "company-a"
  if (!hostname.includes('localhost') && hostname.split('.').length > 2) {
    const subdomain = hostname.split('.')[0];
    // Skip common subdomains
    if (!['www', 'api', 'admin'].includes(subdomain)) {
      return subdomain;
    }
  }

  // Strategy 2: Path-based (for development & localhost)
  // /company-a/admin → "company-a"
  const pathMatch = pathname.match(/^\/([^\/]+)\//);
  if (pathMatch) {
    return pathMatch[1];
  }

  return null;
};

/**
 * Get tenant URL for navigation
 *
 * @param {string} tenantSlug - Tenant slug (e.g., "company-a")
 * @param {string} path - Path to navigate to (e.g., "/admin")
 * @returns {string} Full URL
 */
export const getTenantUrl = (tenantSlug, path = '/admin') => {
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;

  // Use subdomain strategy in production
  if (!hostname.includes('localhost')) {
    const baseDomain = hostname.split('.').slice(-2).join('.');
    return `${protocol}//${tenantSlug}.${baseDomain}${path}`;
  }

  // Use path strategy in development
  return `/${tenantSlug}${path}`;
};

/**
 * Check if current environment supports subdomains
 */
export const isSubdomainSupported = () => {
  return !window.location.hostname.includes('localhost');
};

/**
 * Redirect to tenant-specific URL
 *
 * @param {string} tenantSlug
 * @param {string} path
 */
export const redirectToTenant = (tenantSlug, path = '/admin') => {
  const url = getTenantUrl(tenantSlug, path);

  if (isSubdomainSupported() && !window.location.hostname.startsWith(tenantSlug)) {
    // Full redirect (changes subdomain)
    window.location.href = url;
  } else {
    // SPA navigation (same domain)
    window.location.pathname = url;
  }
};
