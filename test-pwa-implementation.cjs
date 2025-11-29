#!/usr/bin/env node
/**
 * Test script to verify PWA cache strategy implementation
 */

const fs = require('fs');
const path = require('path');

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    const result = fn();
    if (result === true || result === undefined) {
      console.log(`✓ ${name}`);
      passed++;
    } else {
      console.log(`✗ ${name}: ${result}`);
      failed++;
    }
  } catch (error) {
    console.log(`✗ ${name}: ${error.message}`);
    failed++;
  }
}

console.log('Testing PWA Cache Strategy Implementation\n');

// Test 1: version.json exists in dist
test('version.json generated in dist/', () => {
  const versionPath = path.join(__dirname, 'dist', 'version.json');
  if (!fs.existsSync(versionPath)) return 'version.json not found';
  const content = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
  if (!content.version || !content.buildTime) return 'version.json missing required fields';
  return true;
});

// Test 2: __APP_VERSION__ is defined in TypeScript
test('__APP_VERSION__ declared in vite-env.d.ts', () => {
  const envPath = path.join(__dirname, 'src', 'vite-env.d.ts');
  const content = fs.readFileSync(envPath, 'utf8');
  if (!content.includes('declare const __APP_VERSION__')) {
    return '__APP_VERSION__ not declared';
  }
  return true;
});

// Test 3: Version plugin exists
test('Version plugin file exists', () => {
  const pluginPath = path.join(__dirname, 'vite-plugin-version.ts');
  if (!fs.existsSync(pluginPath)) return 'vite-plugin-version.ts not found';
  return true;
});

// Test 4: vite.config.ts uses version plugin and define
test('vite.config.ts uses version plugin and define', () => {
  const configPath = path.join(__dirname, 'vite.config.ts');
  const content = fs.readFileSync(configPath, 'utf8');
  if (!content.includes('versionPlugin')) return 'versionPlugin not used';
  if (!content.includes('__APP_VERSION__')) return '__APP_VERSION__ not in define';
  return true;
});

// Test 5: useVersionCheck hook exists
test('useVersionCheck hook exists', () => {
  const hookPath = path.join(__dirname, 'src', 'hooks', 'useVersionCheck.ts');
  if (!fs.existsSync(hookPath)) return 'useVersionCheck.ts not found';
  const content = fs.readFileSync(hookPath, 'utf8');
  if (!content.includes('useVersionCheck')) return 'useVersionCheck function not found';
  if (!content.includes('checkForWaitingWorker')) return 'checkForWaitingWorker not found';
  if (!content.includes('sendSkipWaiting')) return 'sendSkipWaiting not found';
  return true;
});

// Test 6: UpdateToast component exists
test('UpdateToast component exists', () => {
  const componentPath = path.join(__dirname, 'src', 'components', 'UpdateToast.tsx');
  if (!fs.existsSync(componentPath)) return 'UpdateToast.tsx not found';
  const content = fs.readFileSync(componentPath, 'utf8');
  if (!content.includes('UpdateToast')) return 'UpdateToast component not found';
  return true;
});

// Test 7: App.tsx uses useVersionCheck
test('App.tsx integrates useVersionCheck', () => {
  const appPath = path.join(__dirname, 'src', 'App.tsx');
  const content = fs.readFileSync(appPath, 'utf8');
  if (!content.includes('useVersionCheck')) return 'useVersionCheck not imported/used';
  if (!content.includes('UpdateToast')) return 'UpdateToast not imported/used';
  return true;
});

// Test 8: Service worker exists
test('Service worker exists', () => {
  const swPath = path.join(__dirname, 'public', 'sw.js');
  if (!fs.existsSync(swPath)) return 'sw.js not found';
  return true;
});

// Test 9: Service worker has correct structure
test('Service worker structure is correct', () => {
  const swPath = path.join(__dirname, 'public', 'sw.js');
  const content = fs.readFileSync(swPath, 'utf8');
  
  // Should NOT have skipWaiting in install event
  const installMatch = content.match(/addEventListener\(['"]install['"].*?\{[\s\S]*?\}/);
  if (installMatch && installMatch[0].includes('skipWaiting()')) {
    return 'skipWaiting() found in install event (should not be there)';
  }
  
  // Should have skipWaiting in message handler
  if (!content.includes('message') || !content.match(/message.*skipWaiting/s)) {
    return 'skipWaiting() not found in message handler';
  }
  
  // Should have clients.claim in activate event
  if (!content.includes('activate') || !content.match(/activate.*clients\.claim/s)) {
    return 'clients.claim() not found in activate event';
  }
  
  // Should have Network First for HTML
  if (!content.includes('navigate') || !content.includes('index.html')) {
    return 'Network First strategy for HTML not found';
  }
  
  return true;
});

// Test 10: main.tsx registers service worker
test('main.tsx registers service worker', () => {
  const mainPath = path.join(__dirname, 'src', 'main.tsx');
  const content = fs.readFileSync(mainPath, 'utf8');
  if (!content.includes('serviceWorker')) return 'Service worker registration not found';
  if (!content.includes('registration.waiting')) return 'Already-waiting check not found';
  if (!content.includes('updatefound')) return 'updatefound listener not found';
  if (!content.includes('controllerchange')) return 'controllerchange listener not found';
  return true;
});

// Test 11: _headers file exists
test('_headers file exists in public/', () => {
  const headersPath = path.join(__dirname, 'public', '_headers');
  if (!fs.existsSync(headersPath)) return '_headers not found';
  const content = fs.readFileSync(headersPath, 'utf8');
  if (!content.includes('index.html')) return 'index.html header not found';
  if (!content.includes('sw.js')) return 'sw.js header not found';
  if (!content.includes('version.json')) return 'version.json header not found';
  if (!content.includes('assets/*')) return 'assets/* header not found';
  return true;
});

// Test 12: manifest.json exists
test('manifest.json exists', () => {
  const manifestPath = path.join(__dirname, 'public', 'manifest.json');
  if (!fs.existsSync(manifestPath)) return 'manifest.json not found';
  const content = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!content.name || !content.start_url) return 'manifest.json missing required fields';
  return true;
});

// Test 13: index.html has PWA meta tags
test('index.html has PWA meta tags', () => {
  const htmlPath = path.join(__dirname, 'index.html');
  const content = fs.readFileSync(htmlPath, 'utf8');
  if (!content.includes('manifest.json')) return 'manifest link not found';
  if (!content.includes('theme-color')) return 'theme-color meta tag not found';
  if (!content.includes('apple-mobile-web-app-capable')) return 'apple-mobile-web-app-capable not found';
  return true;
});

// Test 14: Version is in built bundle
test('Version is injected into built bundle', () => {
  const versionPath = path.join(__dirname, 'dist', 'version.json');
  if (!fs.existsSync(versionPath)) return 'version.json not found in dist';
  const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
  const version = versionData.version;
  
  // Find the main JS bundle
  const distDir = path.join(__dirname, 'dist', 'assets');
  if (!fs.existsSync(distDir)) return 'dist/assets not found';
  const files = fs.readdirSync(distDir);
  const jsFile = files.find(f => f.endsWith('.js') && f.startsWith('index-'));
  if (!jsFile) return 'Main JS bundle not found';
  
  const bundlePath = path.join(distDir, jsFile);
  const bundleContent = fs.readFileSync(bundlePath, 'utf8');
  if (!bundleContent.includes(version)) {
    return `Version ${version} not found in bundle`;
  }
  return true;
});

// Test 15: _headers copied to dist
test('_headers copied to dist/', () => {
  const headersPath = path.join(__dirname, 'dist', '_headers');
  if (!fs.existsSync(headersPath)) return '_headers not found in dist';
  return true;
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

