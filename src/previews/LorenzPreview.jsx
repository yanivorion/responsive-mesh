import React, { useRef, useEffect } from 'react';

export function LorenzPreview({ width = 200, height = 150 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;

    let x = 0.1,
      y = 0,
      z = 0;
    const points = [];
    const sigma = 10,
      rho = 28,
      beta = 8 / 3;

    const animate = () => {
      for (let i = 0; i < 5; i++) {
        const dt = 0.005;
        const dx = sigma * (y - x) * dt;
        const dy = (x * (rho - z) - y) * dt;
        const dz = (x * y - beta * z) * dt;
        x += dx;
        y += dy;
        z += dz;
        points.push({ x: width / 2 + x * 3, y: height / 2 + (z - 25) * 2 });
        if (points.length > 300) points.shift();
      }

      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(28, 25, 23, 0.5)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [width, height]);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />;
}
