import createAppDefault from '../../public/app.js';
import fs from 'fs';
import path from 'path';

const createApp = createAppDefault;

/**
 * Scan the codebase to discover mount paths used in app.use() calls
 */
function discoverMountPaths() {
  const mountPaths = new Set(['/']); // Always include root
  
  try {
    // Scan main route files for router.use() calls with mount paths
    const routeFiles = [
      path.join(process.cwd(), 'routes', 'index.ts'),
      path.join(process.cwd(), 'src', 'app.ts')
    ];
    
    routeFiles.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Look for router.use('/path', ...) and app.use('/path', ...) patterns
        const mountMatches = content.match(/(router|app)\.use\(['"`]([^'"`]+)['"`]/g);
        if (mountMatches) {
          mountMatches.forEach(match => {
            const pathMatch = match.match(/['"`]([^'"`]+)['"`]/);
            if (pathMatch && pathMatch[1] && pathMatch[1] !== '/') {
              mountPaths.add(pathMatch[1]);
            }
          });
        }
      }
    });
    
    // Also scan all route files in the routes directory for context
    const routesDir = path.join(process.cwd(), 'routes');
    if (fs.existsSync(routesDir)) {
      const routeFiles = fs.readdirSync(routesDir);
      routeFiles.forEach(file => {
        if (file.endsWith('.ts') || file.endsWith('.js')) {
          const routeContent = fs.readFileSync(path.join(routesDir, file), 'utf8');
          
          // Extract potential mount paths from route definitions
          const routeMatches = routeContent.match(/router\.(get|post|put|delete)\(['"`]([^'"`]+)['"`]/g);
          if (routeMatches) {
            routeMatches.forEach(match => {
              const pathMatch = match.match(/['"`]([^'"`]+)['"`]/);
              if (pathMatch && pathMatch[1]) {
                const routePath = pathMatch[1];
                // Extract potential mount path (first segment)
                if (routePath.startsWith('/')) {
                  const segments = routePath.split('/').filter(s => s);
                  if (segments.length > 0 && !segments[0].startsWith(':')) {
                    mountPaths.add('/' + segments[0]);
                  }
                }
              }
            });
          }
        }
      });
    }
    
    const paths = Array.from(mountPaths);
    // console.log('Discovered mount paths from codebase:', paths);
    return paths;
    
  } catch (error) {
    console.error('Error scanning codebase for mount paths:', error.message);
    console.error('Route detection may be incomplete. Please check the codebase scanning logic.');
    // Return minimal set - just root path
    return ['/'];
  }
}

/**
 * Custom route extraction function for Express 5
 * This function uses the matchers property to dynamically detect mount paths
 */
function extractRoutesExpress5(app) {
  const routes = [];
  
  if (!app.router?.stack) {
    console.log('No router stack found');
    return routes;
  }
  
  const stack = app.router.stack;
  
  // Find the main router layer
  const routerLayer = stack.find(layer => layer.name === 'router' && layer.handle && layer.handle.stack);
  
  if (!routerLayer) {
    console.log('No main router found');
    return routes;
  }
  
  // Examine the main router's sub-layers
  const subStack = routerLayer.handle.stack;
  const subLayerMountPaths = [];
  
  // First pass: detect mount paths using discovered paths from codebase
  const discoveredPaths = discoverMountPaths();
  
  subStack.forEach((subLayer, index) => {
    let mountPath = '';
    
    // Check if the subLayer has a regexp property that reveals the mount path
    if (subLayer.regexp) {
      const regexStr = subLayer.regexp.source;
      
      // Try to match against discovered paths
      for (const testPath of discoveredPaths) {
        if (testPath === '/') {
          if (regexStr === '^\\/$' || regexStr === '^\\/') {
            mountPath = '/';
            break;
          }
        } else {
          const escapedPath = testPath.replace(/\//g, '\\/');
          if (regexStr.includes(escapedPath)) {
            mountPath = testPath;
            break;
          }
        }
      }
    }
    
    // Fallback: use matcher testing with discovered paths
    if (!mountPath && subLayer.matchers && subLayer.matchers.length > 0) {
      const matcher = subLayer.matchers[0];
      
      for (const testPath of discoveredPaths) {
        try {
          const result = matcher(testPath);
          if (result && result.path) {
            mountPath = result.path;
            break;
          }
        } catch (e) {
          // Ignore matcher errors
        }
      }
    }
    
    subLayerMountPaths[index] = mountPath;
  });
  
  // Second pass: extract routes from the main router's sub-layers
  subStack.forEach((subLayer, index) => {
    const mountPath = subLayerMountPaths[index];
    
    if (subLayer.handle && subLayer.handle.stack) {
      // This is a router with routes
      subLayer.handle.stack.forEach(routeLayer => {
        if (routeLayer.route) {
          const route = routeLayer.route;
          const methods = Object.keys(route.methods);
          
          methods.forEach(method => {
            if (method !== '_all') {
              const fullPath = mountPath === '/' ? route.path : mountPath + route.path;
              routes.push({
                method: method.toUpperCase(),
                path: fullPath
              });
            }
          });
        }
      });
    } else if (subLayer.route) {
      // This is a direct route
      const route = subLayer.route;
      const methods = Object.keys(route.methods);
      
      methods.forEach(method => {
        if (method !== '_all') {
          // For direct routes on the main router, just use the route path
          const fullPath = route.path;
          routes.push({
            method: method.toUpperCase(),
            path: fullPath
          });
        }
      });
    }
  });
  
  return routes;
}

// Main execution
console.log('Creating app...');
const app = createApp();

// Wait a moment for routes to be fully registered
setTimeout(() => {
  const routes = extractRoutesExpress5(app);
  
  console.log('\n=== All Routes ===');
  routes.forEach((route, index) => {
    console.log(`${index + 1}. ${route.method} ${route.path}`);
  });
  
  console.log(`\nTotal routes found: ${routes.length}`);
  
  // Exit the process
  process.exit(0);
}, 500);