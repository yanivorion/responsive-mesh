import React, { useRef, useEffect } from 'react';

export function PhysarumPreview({ width = 200, height = 150 }) {
  const canvasRef = useRef(null);
  const trailRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const trail = trailRef.current;
    if (!canvas || !trail) return;

    const ctx = canvas.getContext('2d');
    const tCtx = trail.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    trail.width = width;
    trail.height = height;

    tCtx.fillStyle = '#FFFFFF';
    tCtx.fillRect(0, 0, width, height);

    const agents = [];
    const cx = width / 2,
      cy = height / 2;
    for (let i = 0; i < 300; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 25;
      agents.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        angle: Math.random() * Math.PI * 2,
      });
    }

    const animate = () => {
      tCtx.fillStyle = 'rgba(255,255,255,0.04)';
      tCtx.fillRect(0, 0, width, height);
      tCtx.fillStyle = '#1C1917';

      agents.forEach((a) => {
        a.x += Math.cos(a.angle) * 0.6;
        a.y += Math.sin(a.angle) * 0.6;
        a.angle += (Math.random() - 0.5) * 0.3;
        if (a.x < 0 || a.x >= width || a.y < 0 || a.y >= height) {
          a.angle = Math.random() * Math.PI * 2;
          a.x = cx + (Math.random() - 0.5) * 30;
          a.y = cy + (Math.random() - 0.5) * 30;
        }
        tCtx.fillRect(a.x, a.y, 1, 1);
      });

      ctx.drawImage(trail, 0, 0);
      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [width, height]);

  return (
    <div style={{ position: 'relative', width, height }}>
      <canvas ref={trailRef} style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}
