#!/usr/bin/env node
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateIcons() {
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  const publicDir = join(__dirname, '..', 'public');
  const iconsDir = join(publicDir, 'icons');
  const sourceSvg = join(publicDir, 'icon-source.svg');

  // Ensure icons directory exists
  mkdirSync(iconsDir, { recursive: true });

  console.log('Generating PWA icons from SVG source...\n');

  // Generate PNG icons
  for (const size of sizes) {
    const outputPath = join(iconsDir, `icon-${size}x${size}.png`);

    await sharp(sourceSvg).resize(size, size).png().toFile(outputPath);

    console.log(`✓ Generated ${size}x${size} icon`);
  }

  // Generate favicon (16x16 and 32x32)
  const faviconSizes = [16, 32];
  for (const size of faviconSizes) {
    const outputPath = join(publicDir, `favicon-${size}x${size}.png`);

    await sharp(sourceSvg).resize(size, size).png().toFile(outputPath);

    console.log(`✓ Generated ${size}x${size} favicon`);
  }

  // Generate apple-touch-icon (180x180)
  const appleTouchIcon = join(publicDir, 'apple-touch-icon.png');
  await sharp(sourceSvg).resize(180, 180).png().toFile(appleTouchIcon);

  console.log('✓ Generated 180x180 apple-touch-icon');

  // Generate iOS splash screens (common sizes)
  const splashScreens = [
    { width: 640, height: 1136, name: 'apple-splash-640-1136.png' }, // iPhone SE
    { width: 750, height: 1334, name: 'apple-splash-750-1334.png' }, // iPhone 8
    { width: 1125, height: 2436, name: 'apple-splash-1125-2436.png' }, // iPhone X
    { width: 1242, height: 2688, name: 'apple-splash-1242-2688.png' }, // iPhone 11 Pro Max
    { width: 828, height: 1792, name: 'apple-splash-828-1792.png' }, // iPhone 11
    { width: 1170, height: 2532, name: 'apple-splash-1170-2532.png' }, // iPhone 12/13 Pro
  ];

  for (const splash of splashScreens) {
    const outputPath = join(publicDir, 'splash-screens', splash.name);

    // Create splash screens directory if it doesn't exist
    mkdirSync(join(publicDir, 'splash-screens'), { recursive: true });

    // Center the icon on a background
    const iconSize = Math.min(splash.width, splash.height) * 0.4; // Icon takes 40% of smallest dimension

    await sharp({
      create: {
        width: splash.width,
        height: splash.height,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([
        {
          input: await sharp(sourceSvg)
            .resize(Math.round(iconSize), Math.round(iconSize))
            .png()
            .toBuffer(),
          gravity: 'center',
        },
      ])
      .png()
      .toFile(outputPath);

    console.log(`✓ Generated splash screen ${splash.name}`);
  }

  console.log('\n✨ All icons generated successfully!');
}

generateIcons().catch((error) => {
  console.error('Error generating icons:', error);
  process.exit(1);
});
