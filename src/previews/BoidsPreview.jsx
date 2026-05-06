import React, { useRef, useEffect } from 'react';

export function BoidsPreview({ width = 200, height = 150 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;

    const boids = [];
    for (let i = 0; i < 80; i++) {
      boids.push({
        x: width / 2 + (Math.random() - 0.5) * 60,
        y: height / 2 + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
      });
    }

    const animate = () => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#1C1917';

      boids.forEach((b) => {
        b.vx += (width / 2 - b.x) * 0.001;
        b.vy += (height / 2 - b.y) * 0.001;
        b.x += b.vx;
        b.y += b.vy;

        const angle = Math.atan2(b.vy, b.vx);
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(4, 0);
        ctx.lineTo(-2, 1.5);
        ctx.lineTo(-2, -1.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
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
