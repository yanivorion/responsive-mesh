import React, { useRef, useEffect } from 'react';

export function WavePreview({ width = 200, height = 150 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;

    const sources = [
      { x: width * 0.3, y: height * 0.4 },
      { x: width * 0.7, y: height * 0.6 },
    ];

    let t = 0;
    const animate = () => {
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let sum = 0;
          sources.forEach((s) => {
            const dx = x - s.x,
              dy = y - s.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            sum += Math.sin(dist * 0.1 - t * 3);
          });
          const val = (sum / sources.length + 1) / 2;
          const idx = (y * width + x) * 4;
          const c = Math.floor(255 - val * 40);
          data[idx] = c;
          data[idx + 1] = c;
          data[idx + 2] = c;
          data[idx + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      t += 0.016;
      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [width, height]);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />;
}
