import fs from "fs";
import path from "path";
import sharp from "sharp";

const OUTPUT_DIR = path.join(__dirname, "..", "public", "icons");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Dental tooth + sparkle modern SVG definition
const createSvgIcon = (size: number, isMaskable: boolean = false) => {
  // If maskable, the content must be within the central 60-80% safe zone
  const padding = isMaskable ? size * 0.15 : size * 0.08;
  const innerSize = size - padding * 2;
  const scale = innerSize / 100;
  const offset = padding;

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#006eb8"/>
      <stop offset="50%" stop-color="#0061a4"/>
      <stop offset="100%" stop-color="#004373"/>
    </linearGradient>
    <linearGradient id="toothGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#e8f3fb"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <filter id="dropGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#002b4d" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Background container -->
  ${
    isMaskable
      ? `<rect width="${size}" height="${size}" fill="url(#bgGrad)"/>`
      : `<rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bgGrad)"/>`
  }

  <!-- Emblem Group with Safe Zone Scaling -->
  <g transform="translate(${offset}, ${offset}) scale(${scale})" filter="url(#dropGlow)">
    <!-- Stylized Tooth Path -->
    <path
      d="M50 14 C36 14 26 22 24 36 C22 47 25 58 29 68 C33 78 36 88 40 88 C43 88 44 80 47 72 C48 68 52 68 53 72 C56 80 57 88 60 88 C64 88 67 78 71 68 C75 58 78 47 76 36 C74 22 64 14 50 14 Z"
      fill="url(#toothGrad)"
    />

    <!-- Gentle Inner Tooth Shadow/Facet -->
    <path
      d="M50 18 C40 18 32 24 30 36 C28.5 45 31 54 34.5 63 C37.5 71 40 79 42 81 C42.5 76 44 68 47.5 64 C49 62 51 62 52.5 64 C56 68 57.5 76 58 81 C60 79 62.5 71 65.5 63 C69 54 71.5 45 70 36 C68 24 60 18 50 18 Z"
      fill="#ffffff"
      opacity="0.85"
    />

    <!-- Clinical Cross / Sparkle Accent Top Right -->
    <g transform="translate(62, 20) scale(0.65)">
      <path
        d="M20 0 L23 15 L38 20 L23 25 L20 40 L17 25 L2 20 L17 15 Z"
        fill="url(#accentGrad)"
      />
    </g>

    <!-- Small Micro Sparkle Bottom Left -->
    <g transform="translate(18, 55) scale(0.35)">
      <path
        d="M20 0 L23 15 L38 20 L23 25 L20 40 L17 25 L2 20 L17 15 Z"
        fill="#38bdf8"
        opacity="0.9"
      />
    </g>
  </g>
</svg>
`;
};

async function generateIcons() {
  const iconDefinitions = [
    { name: "icon-192x192.png", size: 192, maskable: false },
    { name: "icon-512x512.png", size: 512, maskable: false },
    { name: "icon-maskable-192x192.png", size: 192, maskable: true },
    { name: "icon-maskable-512x512.png", size: 512, maskable: true },
    { name: "apple-touch-icon.png", size: 180, maskable: false },
    { name: "icon-96x96.png", size: 96, maskable: false },
  ];

  for (const def of iconDefinitions) {
    const svg = createSvgIcon(def.size, def.maskable);
    const destPath = path.join(OUTPUT_DIR, def.name);
    await sharp(Buffer.from(svg))
      .png({ compressionLevel: 9 })
      .toFile(destPath);
    console.log(`Generated: ${def.name} (${def.size}x${def.size})`);
  }

  // Also save master SVG
  const masterSvg = createSvgIcon(512, false);
  fs.writeFileSync(path.join(OUTPUT_DIR, "icon.svg"), masterSvg);
  console.log("Saved icon.svg");
}

generateIcons()
  .then(() => console.log("All PWA icons generated successfully!"))
  .catch((err) => {
    console.error("Error generating icons:", err);
    process.exit(1);
  });
