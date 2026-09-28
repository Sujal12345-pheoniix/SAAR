'use client';

import { useEffect, useRef } from 'react';

interface HeroMotionBackgroundProps {
  mouseX?: number;
  mouseY?: number;
}

export function HeroMotionBackground({ mouseX = 0, mouseY = 0 }: HeroMotionBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let isVisible = true;

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(canvas);

    const resize = () => {
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // 3D Grid Parameters
    const cols = 26;
    const rows = 18;
    const spacingX = 64;
    const spacingZ = 48;

    // Floating 3D Motes / Energy Particles
    const motesCount = 45;
    const motes = Array.from({ length: motesCount }, () => ({
      x: (Math.random() - 0.5) * 1200,
      y: (Math.random() - 0.5) * 600,
      z: Math.random() * 800 + 100,
      radius: Math.random() * 2.5 + 1.2,
      speedY: Math.random() * 0.4 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      color: Math.random() > 0.6 ? '#06B6D4' : Math.random() > 0.3 ? '#8B5CF6' : '#6366F1',
      pulse: Math.random() * Math.PI,
    }));

    let time = 0;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;

    const render = () => {
      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      time += 0.016;

      // Smooth camera tilt based on mouse
      targetTiltX = mouseX * 0.08;
      targetTiltY = mouseY * 0.06;
      currentTiltX += (targetTiltX - currentTiltX) * 0.05;
      currentTiltY += (targetTiltY - currentTiltY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const fov = 420;
      const horizonY = height * 0.48 + currentTiltY * 120;
      const originX = width * 0.5 + currentTiltX * 140;

      // ---- 1. Volumetric Aura Sweeps ----
      const radialGrad1 = ctx.createRadialGradient(
        originX + Math.sin(time * 0.5) * 80,
        horizonY - 80 + Math.cos(time * 0.4) * 40,
        30,
        originX,
        horizonY,
        500
      );
      radialGrad1.addColorStop(0, 'rgba(99, 102, 241, 0.16)');
      radialGrad1.addColorStop(0.4, 'rgba(139, 92, 246, 0.09)');
      radialGrad1.addColorStop(1, 'rgba(99, 102, 241, 0)');

      ctx.fillStyle = radialGrad1;
      ctx.beginPath();
      ctx.arc(originX, horizonY, 520, 0, Math.PI * 2);
      ctx.fill();

      // Cyan accent aura
      const cyanGrad = ctx.createRadialGradient(
        originX + Math.cos(time * 0.35) * 200,
        horizonY + 60,
        10,
        originX,
        horizonY + 60,
        380
      );
      cyanGrad.addColorStop(0, 'rgba(6, 182, 212, 0.12)');
      cyanGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.03)');
      cyanGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

      ctx.fillStyle = cyanGrad;
      ctx.beginPath();
      ctx.arc(originX, horizonY + 60, 400, 0, Math.PI * 2);
      ctx.fill();

      // ---- 2. 3D Undulating Cyber Wave Lattice ----
      // Project 3D grid points
      const points: { x: number; y: number; z: number; px: number; py: number; depthAlpha: number; waveH: number }[][] = [];

      for (let r = 0; r < rows; r++) {
        points[r] = [];
        const z = (r + 1) * spacingZ + 120;
        const scale = fov / z;

        for (let c = 0; c < cols; c++) {
          const worldX = (c - cols / 2) * spacingX;

          // Multi-frequency wave formula
          const distFromCenter = Math.sqrt(worldX * worldX + z * z) * 0.005;
          const wave1 = Math.sin(worldX * 0.008 + time * 1.5) * 32;
          const wave2 = Math.cos(z * 0.012 - time * 1.8) * 28;
          const wave3 = Math.sin(distFromCenter * 4 - time * 2) * 20;
          const waveH = wave1 + wave2 + wave3;

          const worldY = 140 + waveH; // Positioned below horizon

          // 3D perspective projection
          const px = originX + worldX * scale;
          const py = horizonY + worldY * scale;

          const depthAlpha = Math.max(0, Math.min(1, (z - 100) / (rows * spacingZ)));
          const fade = Math.sin(depthAlpha * Math.PI) * 0.85;

          points[r][c] = { x: worldX, y: worldY, z, px, py, depthAlpha: fade, waveH };
        }
      }

      // Draw Lattice Horizontal Ribbons
      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        for (let c = 0; c < cols; c++) {
          const pt = points[r][c];
          if (c === 0) {
            ctx.moveTo(pt.px, pt.py);
          } else {
            ctx.lineTo(pt.px, pt.py);
          }
        }
        const rowAlpha = points[r][Math.floor(cols / 2)].depthAlpha * 0.35;
        ctx.strokeStyle = `rgba(99, 102, 241, ${rowAlpha})`;
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }

      // Draw Lattice Vertical Lines
      for (let c = 0; c < cols; c += 2) {
        ctx.beginPath();
        for (let r = 0; r < rows; r++) {
          const pt = points[r][c];
          if (r === 0) {
            ctx.moveTo(pt.px, pt.py);
          } else {
            ctx.lineTo(pt.px, pt.py);
          }
        }
        const colAlpha = points[Math.floor(rows / 2)][c]?.depthAlpha * 0.28 || 0.1;
        ctx.strokeStyle = `rgba(139, 92, 246, ${colAlpha})`;
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }

      // Draw Glowing Vertex Nodes on Wave Peaks
      for (let r = 0; r < rows; r += 2) {
        for (let c = 0; c < cols; c += 2) {
          const pt = points[r][c];
          if (pt.waveH > 16 && pt.depthAlpha > 0.2) {
            const nodeRadius = Math.max(1, (pt.waveH / 40) * 2.8);
            ctx.beginPath();
            ctx.arc(pt.px, pt.py, nodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = pt.waveH > 35 ? 'rgba(6, 182, 212, 0.8)' : 'rgba(165, 180, 252, 0.7)';
            ctx.shadowColor = '#6366F1';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      // ---- 3. Floating 3D Motes & Upward Drifting Signals ----
      motes.forEach((mote) => {
        mote.y -= mote.speedY;
        mote.pulse += mote.pulseSpeed;

        if (mote.y < -350) {
          mote.y = 350;
          mote.x = (Math.random() - 0.5) * 1200;
        }

        const scale = fov / (fov + mote.z);
        const px = originX + mote.x * scale;
        const py = horizonY + mote.y * scale;

        if (px > 0 && px < width && py > 0 && py < height) {
          const pulseIntensity = (Math.sin(mote.pulse) * 0.35 + 0.65) * scale;
          const r = mote.radius * scale * (1 + pulseIntensity * 0.3);

          ctx.beginPath();
          ctx.arc(px, py, Math.max(0.9, r), 0, Math.PI * 2);
          ctx.fillStyle = mote.color;
          ctx.globalAlpha = Math.min(0.85, pulseIntensity * 0.9);
          ctx.shadowColor = mote.color;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      observer.disconnect();
      cancelAnimationFrame(animId);
    };
  }, [mouseX, mouseY]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none w-full h-full"
      style={{
        display: 'block',
        zIndex: 0,
        opacity: 0.9,
      }}
      aria-hidden="true"
    />
  );
}
