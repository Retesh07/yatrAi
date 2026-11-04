const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'docs', 'assets');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const images = [
  {
    src: 'C:/Users/retes/.gemini/antigravity/brain/6088ac28-b531-4966-be94-6758b2bba114/.user_uploaded/media_1793814768971_37383e8b.jpg',
    dest: path.join(targetDir, 'test-coverage.jpg')
  },
  {
    src: 'C:/Users/retes/.gemini/antigravity/brain/6088ac28-b531-4966-be94-6758b2bba114/.user_uploaded/media_1793814796889_7555dc0b.jpg',
    dest: path.join(targetDir, 'k6-benchmark.jpg')
  }
];

images.forEach(({ src, dest }) => {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied: ${path.basename(dest)}`);
  } else {
    console.warn(`Source not found: ${src}`);
  }
});
console.log('Assets setup complete!');

