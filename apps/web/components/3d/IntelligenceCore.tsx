'use client';

import { useEffect, useRef } from 'react';

interface IntelligenceCoreProps {
  mouseX?: number;
  mouseY?: number;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  radius: number;
  alpha: number;
  speed: number;
}

export function IntelligenceCore({ mouseX = 0, mouseY = 0 }: IntelligenceCoreProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 500);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 500);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate orbiting particles
    const particleCount = 75;
    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: (Math.random() - 0.5) * 280,
      y: (Math.random() - 0.5) * 280,
      z: (Math.random() - 0.5) * 280,
      radius: Math.random() * 2 + 1,
      alpha: Math.random() * 0.7 + 0.3,
      speed: (Math.random() * 0.015 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
    }));

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2 + mouseX * 25;
      const centerY = height / 2 - mouseY * 25;

      // 1. Outer ambient radial aura
      const auraGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        20,
        centerX,
        centerY,
        180
      );
      auraGradient.addColorStop(0, 'rgba(99, 102, 241, 0.32)');
      auraGradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.15)');
      auraGradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

      ctx.fillStyle = auraGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 180, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw 3 interactive 3D Orbital Rings with tilted perspectives
      const rings = [
        { radius: 100, tiltX: 0.8, tiltY: 0.35, rotSpeed: 0.6, color: 'rgba(99, 102, 241, 0.55)', nodeColor: '#818CF8' },
        { radius: 135, tiltX: -0.65, tiltY: 0.85, rotSpeed: -0.45, color: 'rgba(139, 92, 246, 0.45)', nodeColor: '#C4B5FD' },
        { radius: 170, tiltX: 0.4, tiltY: -0.7, rotSpeed: 0.35, color: 'rgba(6, 182, 212, 0.4)', nodeColor: '#67E8F9' },
      ];

      rings.forEach((ring, idx) => {
        ctx.save();
        ctx.translate(centerX, centerY);

        const currentRot = time * ring.rotSpeed;
        const totalPoints = 90;

        ctx.beginPath();
        for (let i = 0; i <= totalPoints; i++) {
          const theta = (i / totalPoints) * Math.PI * 2;
          // Apply 3D rotation transform
          const x0 = Math.cos(theta) * ring.radius;
          const y0 = Math.sin(theta) * ring.radius;

          const x1 = x0 * Math.cos(currentRot) - y0 * Math.sin(currentRot);
          const y1 = (x0 * Math.sin(currentRot) + y0 * Math.cos(currentRot)) * ring.tiltX;

          if (i === 0) {
            ctx.moveTo(x1, y1);
          } else {
            ctx.lineTo(x1, y1);
          }
        }
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Orbital Node (glowing beacon travelling along the ring)
        const nodeAngle = currentRot * 1.5 + idx * 2.2;
        const nx0 = Math.cos(nodeAngle) * ring.radius;
        const ny0 = Math.sin(nodeAngle) * ring.radius;
        const nx = nx0 * Math.cos(currentRot) - ny0 * Math.sin(currentRot);
        const ny = (nx0 * Math.sin(currentRot) + ny0 * Math.cos(currentRot)) * ring.tiltX;

        ctx.beginPath();
        ctx.arc(nx, ny, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = ring.nodeColor;
        ctx.shadowColor = ring.nodeColor;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
      });

      // 3. Central Pulsing Intelligence Sphere
      const pulse = Math.sin(time * 2.5) * 4;
      const coreRadius = 46 + pulse;

      // Glow under sphere
      ctx.save();
      const coreGlow = ctx.createRadialGradient(
        centerX - 10,
        centerY - 10,
        5,
        centerX,
        centerY,
        coreRadius + 22
      );
      coreGlow.addColorStop(0, '#A5B4FC');
      coreGlow.addColorStop(0.3, '#6366F1');
      coreGlow.addColorStop(0.7, '#4338CA');
      coreGlow.addColorStop(1, 'rgba(67, 56, 202, 0)');

      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius + 22, 0, Math.PI * 2);
      ctx.fill();

      // Main core sphere gradient
      const sphereGrad = ctx.createRadialGradient(
        centerX - coreRadius * 0.35,
        centerY - coreRadius * 0.35,
        coreRadius * 0.1,
        centerX,
        centerY,
        coreRadius
      );
      sphereGrad.addColorStop(0, '#FFFFFF');
      sphereGrad.addColorStop(0.2, '#A5B4FC');
      sphereGrad.addColorStop(0.55, '#6366F1');
      sphereGrad.addColorStop(0.9, '#4338CA');
      sphereGrad.addColorStop(1, '#312E81');

      ctx.fillStyle = sphereGrad;
      ctx.shadowColor = 'rgba(99, 102, 241, 0.6)';
      ctx.shadowBlur = 28;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();

      // 4. Orbiting Star / Particle Dust
      particles.forEach((p) => {
        // Rotate around Y axis
        const cosA = Math.cos(p.speed);
        const sinA = Math.sin(p.speed);
        const x = p.x * cosA - p.z * sinA;
        const z = p.x * sinA + p.z * cosA;
        p.x = x;
        p.z = z;

        // Perspective projection
        const fov = 320;
        const scale = fov / (fov + z + 150);
        const px = centerX + x * scale;
        const py = centerY + p.y * scale;

        if (scale > 0 && px > 0 && px < width && py > 0 && py < height) {
          ctx.beginPath();
          ctx.arc(px, py, Math.max(0.8, p.radius * scale), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(165, 180, 252, ${Math.min(1, p.alpha * scale)})`;
          ctx.fill();
        }
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [mouseX, mouseY]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        background: 'transparent',
      }}
    />
  );
}
