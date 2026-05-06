import React, { useRef, useEffect } from 'react';

export function CirclePackingPreview({ width = 200, height = 150 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;

    const circles = [];

    const animate = () => {
      if (circles.length < 100) {
        for (let attempt = 0; attempt < 10; attempt++) {
          const x = width / 2 + (Math.random() - 0.5) * width * 0.6;
          const y = height / 2 + (Math.random() - 0.5) * height * 0.6;
          let valid = true;
          for (const c of circles) {
            const dx = x - c.x,
              dy = y - c.y;
            if (Math.sqrt(dx * dx + dy * dy) < c.r + 3) {
              valid = false;
              break;
            }
          }
          if (valid) {
            circles.push({ x, y, r: 2, growing: true });
            break;
          }
        }
      }

      circles.forEach((c) => {
        if (!c.growing) return;
        c.r += 0.2;
        for (const other of circles) {
          if (other === c) continue;
          const dx = c.x - other.x,
            dy = c.y - other.y;
          if (Math.sqrt(dx * dx + dy * dy) < c.r + other.r + 1) {
            c.growing = false;
            break;
          }
        }
      });

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#1C1917';
      ctx.lineWidth = 1;
      circles.forEach((c) => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.stroke();
      });

      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [width, height]);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />;
}
