import React, { useRef, useEffect } from 'react';

export function GameOfLifePreview({ width = 200, height = 150 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;

    const cellSize = 4;
    const cols = Math.floor(width / cellSize);
    const rows = Math.floor(height / cellSize);

    let grid = new Uint8Array(cols * rows);
    for (let i = 0; i < grid.length; i++) grid[i] = Math.random() > 0.7 ? 1 : 0;

    let frameCount = 0;
    const animate = () => {
      frameCount++;
      if (frameCount % 8 === 0) {
        const next = new Uint8Array(cols * rows);
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            let neighbors = 0;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = (x + dx + cols) % cols;
                const ny = (y + dy + rows) % rows;
                neighbors += grid[ny * cols + nx];
              }
            }
            const idx = y * cols + x;
            if (grid[idx] && (neighbors < 2 || neighbors > 3)) next[idx] = 0;
            else if (!grid[idx] && neighbors === 3) next[idx] = 1;
            else next[idx] = grid[idx];
          }
        }
        grid = next;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#1C1917';
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (grid[y * cols + x]) {
            ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
          }
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [width, height]);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />;
}
