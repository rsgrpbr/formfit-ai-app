import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fundo #080B0F
  ctx.fillStyle = '#080B0F';
  ctx.fillRect(0, 0, size, size);

  // Rounded rect (raio 18% do tamanho)
  const radius = size * 0.18;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fillStyle = '#080B0F';
  ctx.fill();

  // Letra "F" em #C8F135
  const fontSize = Math.round(size * 0.72);
  ctx.fillStyle = '#C8F135';
  ctx.font = `900 ${fontSize}px Arial Black, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('F', size / 2, size / 2 + size * 0.04);

  return canvas.toBuffer('image/png');
}

const buf192 = generateIcon(192);
writeFileSync(join(outDir, 'icon-192.png'), buf192);
console.log('✓ icon-192.png');

const buf512 = generateIcon(512);
writeFileSync(join(outDir, 'icon-512.png'), buf512);
console.log('✓ icon-512.png');

console.log('Icons gerados em public/icons/');
