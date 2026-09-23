/**
 * Error Level Analysis (ELA) & Tamper Heatmap Simulator
 * Simulates high-frequency JPEG compression artifact discrepancies and TruFor anomaly heatmaps
 */

export const generateForensicHeatmap = (canvas, img, tamperedBoxes = [], baseTamperScore = 15) => {
  if (!canvas || !img) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // 1. Render dark forensic background with subtle JPEG grid noise
  ctx.fillStyle = '#05070e';
  ctx.fillRect(0, 0, width, height);

  // 2. Draw subtle noiseprint background texture
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    // Generate low-level sensor noise
    const noise = Math.random() * 18;
    data[i] = noise * 0.4;     // R
    data[i + 1] = noise * 0.8; // G (subtle cyan/blue noise)
    data[i + 2] = noise * 1.5; // B
    data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  // 3. Draw high-energy thermal tamper regions for bounding boxes
  tamperedBoxes.forEach((box) => {
    const { x, y, width: bw, height: bh, severity = 0.85, label } = box;
    
    // Pixel coordinates mapped to canvas
    const px = (x / 100) * width;
    const py = (y / 100) * height;
    const pw = (bw / 100) * width;
    const ph = (bh / 100) * height;

    const centerX = px + pw / 2;
    const centerY = py + ph / 2;
    const radius = Math.max(pw, ph) * 0.85;

    // Create radial heat gradient (Crimson -> Amber -> Violet -> Transparent)
    const gradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(255, 30, 30, 0.92)');
    gradient.addColorStop(0.35, 'rgba(255, 140, 0, 0.8)');
    gradient.addColorStop(0.7, 'rgba(168, 85, 247, 0.45)');
    gradient.addColorStop(1, 'rgba(0, 240, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Add high-frequency ELA speckle noise over the tampered box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let s = 0; s < 45; s++) {
      const rx = px + Math.random() * pw;
      const ry = py + Math.random() * ph;
      ctx.fillRect(rx, ry, 2, 2);
    }
  });

  // 4. Subtle overall 8x8 DCT grid artifact overlay
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
  ctx.lineWidth = 1;
  const gridSize = 16;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
};
