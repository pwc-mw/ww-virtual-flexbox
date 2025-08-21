#!/usr/bin/env node

/**
 * Script to inject vue-virtual-scroller CSS directly into the component
 * This ensures the CSS is bundled properly by WeWeb's build system
 */

const fs = require('fs');
const path = require('path');

// Paths
const virtualScrollerCssPath = path.join(__dirname, '../node_modules/vue-virtual-scroller/dist/vue-virtual-scroller.css');
const componentPath = path.join(__dirname, '../src/wwElement.vue');
const componentBackupPath = path.join(__dirname, '../src/wwElement.vue.backup');

// Read the virtual scroller CSS
const virtualScrollerCss = fs.readFileSync(virtualScrollerCssPath, 'utf8');

// Read the component file
const componentContent = fs.readFileSync(componentPath, 'utf8');

// Create backup
fs.writeFileSync(componentBackupPath, componentContent);

// Check if CSS is already injected (to make script idempotent)
if (componentContent.includes('/* INJECTED: vue-virtual-scroller CSS */')) {
  console.log('✅ CSS already injected, skipping...');
  process.exit(0);
}

// Prepare the CSS to inject (formatted and commented)
const cssToInject = `
/* INJECTED: vue-virtual-scroller CSS - DO NOT EDIT MANUALLY */
/* Run 'npm run inject-css' to update from node_modules */
/* Source: node_modules/vue-virtual-scroller/dist/vue-virtual-scroller.css */
${virtualScrollerCss}
/* END INJECTED CSS */
`;

// Find the <style> tag and inject the CSS
const styleTagRegex = /(<style[^>]*>)/;
const newComponentContent = componentContent.replace(
  styleTagRegex,
  `$1\n${cssToInject}`
);

// Write the updated component
fs.writeFileSync(componentPath, newComponentContent);

console.log('✅ Successfully injected vue-virtual-scroller CSS into component');
console.log('📁 Backup saved to:', componentBackupPath);