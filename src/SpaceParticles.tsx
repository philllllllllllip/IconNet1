import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  radius: number;
  velocityX: number;
  velocityY: number;
  alpha: number;
  blink: number;
}

const createParticle = (width: number, height: number): Particle => ({
  x: Math.random() * width,
  y: Math.random() * height,
  radius: Math.random() * 2.5 + 0.5,
  velocityX: Math.random() * 0.6 - 0.3,
  velocityY: Math.random() * 0.9 + 0.1,
  alpha: Math.random() * 0.4 + 0.15,
  blink: Math.random() * 0.02 + 0.01
});

const SpaceParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    const particles: Particle[] = Array.from({ length: 120 }, () => createParticle(canvas.width, canvas.height));

    let frameId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((particle) => {
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
        particle.alpha += (Math.random() - 0.5) * particle.blink;
        if (particle.alpha > 0.6) particle.alpha = 0.6;
        if (particle.alpha < 0.1) particle.alpha = 0.1;

        if (particle.y > canvas.height + 20) {
          particle.y = -20;
          particle.x = Math.random() * canvas.width;
        }
        if (particle.x < -20) particle.x = canvas.width + 20;
        if (particle.x > canvas.width + 20) particle.x = -20;

        ctx.beginPath();
        ctx.fillStyle = `rgba(172, 214, 255, ${particle.alpha})`;
        ctx.shadowBlur = particle.radius * 5;
        ctx.shadowColor = 'rgba(59, 130, 246, 0.35)';
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      frameId = window.requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    frameId = window.requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="space-particles" />;
};

export default SpaceParticles;
