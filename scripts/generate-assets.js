#!/usr/bin/env node

/**
 * Asset Generation Script
 *
 * This script helps generate favicon and OG image assets.
 * Run this after creating your SVG designs to generate all required formats.
 *
 * Prerequisites:
 * - ImageMagick (for PNG generation)
 * - Node.js with Canvas API support
 *
 * Usage:
 * npm run generate-assets
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

console.log('🎨 Generating OpenPeople.ai assets...\n');

// Check if ImageMagick is installed
try {
  execSync('convert -version', { stdio: 'pipe' });
  console.log('✅ ImageMagick found');
} catch (error) {
  console.log('❌ ImageMagick not found. Please install it to generate PNG assets.');
  console.log('   macOS: brew install imagemagick');
  console.log('   Ubuntu: sudo apt-get install imagemagick');
  process.exit(1);
}

// Generate PNG favicons from SVG
console.log('\n📱 Generating favicons...');

const faviconSizes = ['16', '32', '48'];
faviconSizes.forEach(size => {
  const input = path.join(PUBLIC_DIR, 'favicon.svg');
  const output = path.join(PUBLIC_DIR, `favicon-${size}x${size}.png`);

  try {
    execSync(`convert ${input} -resize ${size}x${size} ${output}`);
    console.log(`   ✅ favicon-${size}x${size}.png`);
  } catch (error) {
    console.log(`   ❌ Failed to generate favicon-${size}x${size}.png`);
  }
});

// Generate Apple touch icon
const appleIconPath = path.join(PUBLIC_DIR, 'apple-touch-icon.png');
try {
  execSync(`convert ${path.join(PUBLIC_DIR, 'favicon.svg')} -resize 180x180 ${appleIconPath}`);
  console.log('   ✅ apple-touch-icon.png');
} catch (error) {
  console.log('   ❌ Failed to generate apple-touch-icon.png');
}

// Generate Android icons
const androidSizes = ['192', '512'];
androidSizes.forEach(size => {
  const output = path.join(PUBLIC_DIR, `android-chrome-${size}x${size}.png`);
  try {
    execSync(`convert ${path.join(PUBLIC_DIR, 'favicon.svg')} -resize ${size}x${size} ${output}`);
    console.log(`   ✅ android-chrome-${size}x${size}.png`);
  } catch (error) {
    console.log(`   ❌ Failed to generate android-chrome-${size}x${size}.png`);
  }
});

// Generate traditional favicon.ico
const icoPath = path.join(PUBLIC_DIR, 'favicon.ico');
try {
  execSync(`convert ${path.join(PUBLIC_DIR, 'favicon.svg')} -resize 32x32 ${icoPath}`);
  console.log('   ✅ favicon.ico');
} catch (error) {
  console.log('   ❌ Failed to generate favicon.ico');
}

console.log('\n🖼️  Generating OG images...');

// Note: OG images would typically be created using a design tool like Figma, Canva, or programmatically
// For now, we'll create placeholder files with instructions

const ogImagePath = path.join(PUBLIC_DIR, 'og-image.png');
const twitterImagePath = path.join(PUBLIC_DIR, 'twitter-image.png');

console.log('   📝 OG images need to be created manually or programmatically:');
console.log('   - og-image.png (1200x630) for Facebook/LinkedIn');
console.log('   - twitter-image.png (1200x600) for Twitter');
console.log('   💡 Use tools like Figma, Canva, or @vercel/og for generation');

console.log('\n🎉 Asset generation complete!');
console.log('\n📋 Next steps:');
console.log('1. Create the OG images using your preferred design tool');
console.log('2. Replace the placeholder PNG files in /public');
console.log('3. Test favicons in browser dev tools');
console.log('4. Test OG images using social media debuggers');
console.log('5. Update manifest.json theme colors if needed');

console.log('\n🔗 Useful links:');
console.log('- Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/');
console.log('- Twitter Card Validator: https://cards-dev.twitter.com/validator');
console.log('- Favicon Generator: https://favicon.io/favicon-converter/');