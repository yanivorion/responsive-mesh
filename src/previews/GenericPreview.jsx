import React, { useRef, useEffect } from 'react';

export function GenericPreview({ algorithm, width = 200, height = 150 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;

    let t = 0;
    const animate = () => {
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#1C1917';

      for (let i = 0; i < 20; i++) {
        const x = width / 2 + Math.sin(t + i * 0.3) * 40;
        const y = height / 2 + Math.cos(t * 0.7 + i * 0.3) * 30;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      t += 0.02;
      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [width, height, algorithm]);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />;
}
