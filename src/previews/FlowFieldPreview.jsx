import React, { useRef, useEffect } from 'react';

export function FlowFieldPreview({ width = 200, height = 150 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;

    const particles = [];
    for (let i = 0; i < 150; i++) {
      particles.push({ x: Math.random() * width, y: Math.random() * height, px: 0, py: 0 });
    }

    let t = 0;
    const animate = () => {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(28, 25, 23, 0.3)';
      ctx.lineWidth = 0.5;

      t += 0.01;
      particles.forEach((p) => {
        p.px = p.x;
        p.py = p.y;
        const angle = Math.sin(p.x * 0.02 + t) * Math.cos(p.y * 0.02) * Math.PI * 2;
        p.x += Math.cos(angle);
        p.y += Math.sin(angle);

        if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
          p.x = Math.random() * width;
          p.y = Math.random() * height;
          p.px = p.x;
          p.py = p.y;
        }

        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
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
