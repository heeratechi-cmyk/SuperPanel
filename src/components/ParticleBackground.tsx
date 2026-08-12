import React, { useEffect, useRef } from 'react';

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const particleCount = Math.min(Math.floor(width / 25), 60);
    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      color: string;
      vx: number;
      vy: number;
      alpha: number;
    }> = [];

    const colors = ['rgba(139, 92, 246, ', 'rgba(168, 85, 247, ', 'rgba(99, 102, 241, '];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.8 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.6 + 0.2,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw dark background gradient
      const bgGrad = ctx.createRadialGradient(width / 2, height / 3, 10, width / 2, height / 2, Math.max(width, height));
      bgGrad.addColorStop(0, '#090d16');
      bgGrad.addColorStop(0.5, '#020617');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw indigo / purple ambient glow orbs
      const orb1 = ctx.createRadialGradient(width * 0.2, height * 0.2, 0, width * 0.2, height * 0.2, 400);
      orb1.addColorStop(0, 'rgba(79, 70, 229, 0.12)');
      orb1.addColorStop(1, 'rgba(79, 70, 229, 0)');
      ctx.fillStyle = orb1;
      ctx.fillRect(0, 0, width, height);

      const orb2 = ctx.createRadialGradient(width * 0.8, height * 0.8, 0, width * 0.8, height * 0.8, 450);
      orb2.addColorStop(0, 'rgba(147, 51, 234, 0.1)');
      orb2.addColorStop(1, 'rgba(147, 51, 234, 0)');
      ctx.fillStyle = orb2;
      ctx.fillRect(0, 0, width, height);

      // Draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.shadowBlur = p.radius * 4;
        ctx.shadowColor = '#a855f7';
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}
