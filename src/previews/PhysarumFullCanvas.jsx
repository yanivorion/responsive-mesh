import React, { useRef, useEffect } from 'react';

export function PhysarumGenerativeText() {
  const canvasRef = useRef(null);
  const textCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const stateRef = useRef({});

  const text1 = 'IGNITE';
  const text2 = 'CREATIVITY';

  useEffect(() => {
    const canvas = canvasRef.current;
    const textCanvas = textCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !textCanvas || !container) return;

    const ctx = canvas.getContext('2d');
    const textCtx = textCanvas.getContext('2d');
    const rect = container.getBoundingClientRect();
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);

    canvas.width = width;
    canvas.height = height;
    textCanvas.width = width;
    textCanvas.height = height;

    textCtx.fillStyle = '#000000';
    textCtx.fillRect(0, 0, width, height);
    textCtx.fillStyle = '#FFFFFF';
    textCtx.textAlign = 'center';
    textCtx.textBaseline = 'middle';
    const fontSize = Math.min(width / 8, height / 3);
    textCtx.font = `bold ${fontSize}px Arial, sans-serif`;
    textCtx.fillText(text1, width / 2, height / 2 - fontSize * 0.6);
    textCtx.fillText(text2, width / 2, height / 2 + fontSize * 0.6);

    const imageData = textCtx.getImageData(0, 0, width, height);
    const mask = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) {
      mask[i] = imageData.data[i * 4] > 128 ? 1 : 0;
    }

    const points = [];
    for (let y = 0; y < height; y += 3) {
      for (let x = 0; x < width; x += 3) {
        if (mask[y * width + x]) points.push({ x, y });
      }
    }

    const agents = [];
    const count = Math.min(1500, points.length * 2);
    for (let i = 0; i < count; i++) {
      const pt = points[Math.floor(Math.random() * points.length)];
      agents.push({
        x: pt.x + (Math.random() - 0.5) * 10,
        y: pt.y + (Math.random() - 0.5) * 10,
        angle: Math.random() * Math.PI * 2,
      });
    }

    const trailMap = new Float32Array(width * height);
    const sensorAngle = (45 * Math.PI) / 180;
    const turnAngle = (45 * Math.PI) / 180;

    stateRef.current = { agents, trailMap, points, width, height, sensorAngle, turnAngle };

    const animate = () => {
      const { agents, trailMap, points, width, height, sensorAngle, turnAngle } = stateRef.current;

      const sense = (x, y, angle) => {
        const dist = 9;
        const sx = Math.floor(x + Math.cos(angle) * dist);
        const sy = Math.floor(y + Math.sin(angle) * dist);
        if (sx < 0 || sx >= width || sy < 0 || sy >= height) return 0;
        let val = trailMap[sy * width + sx];
        for (let i = 0; i < points.length; i += 10) {
          const pt = points[i];
          const dx = sx - pt.x,
            dy = sy - pt.y;
          if (dx * dx + dy * dy < 225) {
            val += 0.5;
            break;
          }
        }
        return val;
      };

      for (let i = 0; i < agents.length; i++) {
        const agent = agents[i];
        const fwd = sense(agent.x, agent.y, agent.angle);
        const left = sense(agent.x, agent.y, agent.angle - sensorAngle);
        const right = sense(agent.x, agent.y, agent.angle + sensorAngle);

        if (fwd < left && fwd < right) agent.angle += (Math.random() - 0.5) * 2 * turnAngle;
        else if (left < right) agent.angle += turnAngle;
        else if (right < left) agent.angle -= turnAngle;

        agent.x += Math.cos(agent.angle);
        agent.y += Math.sin(agent.angle);

        let nearText = false;
        for (let j = 0; j < points.length; j += 10) {
          const pt = points[j];
          const dx = agent.x - pt.x,
            dy = agent.y - pt.y;
          if (dx * dx + dy * dy < 900) {
            nearText = true;
            break;
          }
        }
        if (!nearText && points.length > 0) {
          let nearest = points[0],
            nearestDist = Infinity;
          for (let j = 0; j < points.length; j += 10) {
            const pt = points[j];
            const dx = pt.x - agent.x,
              dy = pt.y - agent.y;
            const dist = dx * dx + dy * dy;
            if (dist < nearestDist) {
              nearestDist = dist;
              nearest = pt;
            }
          }
          const targetAngle = Math.atan2(nearest.y - agent.y, nearest.x - agent.x);
          agent.angle += (targetAngle - agent.angle) * 0.1;
        }

        if (agent.x < 0) agent.x = width - 1;
        if (agent.x >= width) agent.x = 0;
        if (agent.y < 0) agent.y = height - 1;
        if (agent.y >= height) agent.y = 0;

        const ix = Math.floor(agent.x),
          iy = Math.floor(agent.y);
        if (ix >= 0 && ix < width && iy >= 0 && iy < height) {
          trailMap[iy * width + ix] = 1;
        }
      }

      for (let i = 0; i < trailMap.length; i++) trailMap[i] *= 0.95;

      const imgData = ctx.createImageData(width, height);
      const data = imgData.data;
      for (let i = 0; i < trailMap.length; i++) {
        const val = trailMap[i];
        const idx = i * 4;
        data[idx] = 255 - (255 - 33) * val;
        data[idx + 1] = 255 - (255 - 37) * val;
        data[idx + 2] = 255 - (255 - 41) * val;
        data[idx + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
      }}
    >
      <canvas ref={textCanvasRef} style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          fontSize: 11,
          fontWeight: 400,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: '#6C757D',
          opacity: 0.7,
        }}
      >
        Physarum (Slime Mold)
      </div>
    </div>
  );
}
