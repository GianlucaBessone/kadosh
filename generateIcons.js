const sharp = require('sharp');
const fs = require('fs');

const svgCode = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <linearGradient id="primary" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1024" height="1024" rx="220" fill="url(#bg)"/>
  
  <!-- Outer border -->
  <rect x="64" y="64" width="896" height="896" rx="160" fill="none" stroke="#e2e8f0" stroke-width="8"/>
  
  <!-- Circle background -->
  <circle cx="512" cy="512" r="320" fill="url(#primary)"/>
  
  <!-- The K -->
  <g transform="translate(512, 512) scale(20) translate(-12, -12)">
    <path d="M7 4v16" stroke="white" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <path d="M17 4l-10 8" stroke="white" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <path d="M17 20l-10-8" stroke="white" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  </g>
</svg>
`;

async function generate() {
  try {
    const buffer = Buffer.from(svgCode);
    
    await sharp(buffer)
      .resize(512, 512)
      .png()
      .toFile('public/icon-512x512.png');
      
    await sharp(buffer)
      .resize(192, 192)
      .png()
      .toFile('public/icon-192x192.png');
      
    await sharp(buffer)
      .resize(180, 180)
      .png()
      .toFile('public/apple-touch-icon.png');
      
    console.log('High-res icons generated successfully!');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

generate();
