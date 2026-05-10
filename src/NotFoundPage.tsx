import React, { useEffect } from 'react';

const NotFoundPage: React.FC = () => {
  const goHome = () => {
    window.location.pathname = '/';
  };

  useEffect(() => {
    const canvas = document.getElementById('notfound-particles') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setSize();

    const particles = Array.from({ length: 80 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      d: Math.random() * 1.2 + 0.3
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(255,255,255,0.6)';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';

      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      update();
      requestAnimationFrame(draw);
    };

    const update = () => {
      particles.forEach(p => {
        p.y -= p.d;
        if (p.y < 0) {
          p.y = canvas.height;
          p.x = Math.random() * canvas.width;
        }
      });
    };

    const handleResize = () => {
      setSize();
    };

    window.addEventListener('resize', handleResize);
    requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="notfound-page">
      <canvas id="notfound-particles" className="notfound-canvas" />
      <div className="notfound-content">
        <h1>Page Not Found</h1>
        <button className="extruded-btn" onClick={goHome}>
          Home
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
