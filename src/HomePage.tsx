import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import './index.css';

const HomePage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  
  useEffect(() => {
    const text = 'IconNet.org';
    let index = 0;
    
    const timer = setInterval(() => {
      if (index <= text.length) {
        setTitle(text.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
        setShowCursor(false);
      }
    }, 150);
    
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    const canvas = document.getElementById('particles') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = Array.from({ length: 80 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      d: Math.random() * 1.2 + 0.3
    }));

    function draw() {
      if (!ctx) return;
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
    }

    function update() {
      particles.forEach(p => {
        p.y += p.d;
        if (p.y > canvas.height) {
          p.y = 0;
          p.x = Math.random() * canvas.width;
        }
      });
    }

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  const handleStartGame = () => {
    window.location.href = '/signup';
  };

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden flex flex-col">
      <canvas id="particles" className="absolute inset-0 pointer-events-none" />

      <div className="flex justify-between items-center px-8 py-4 z-20 relative">
        <h1 className="navbar-title">IconNet</h1>
        <div className="flex gap-4">
          <a href="/login" className="extruded-btn"><i className="fas fa-user"></i> Login</a>
          <a href="/signup" className="extruded-btn"><i className="fas fa-pencil"></i> Register</a>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center z-10 relative">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="hero-title"
        >
          IconNet
        </motion.h1>

        <p className="hero-description">
           Online Trading and Icon Collecting Game Developed in TypeScript.
        </p>

        <button className="extruded-btn" onClick={handleStartGame}>
          Start Playing
        </button>
      </div>

      <div className="absolute bottom-4 left-8 z-20">
        <p className="bottom-title">{title}{showCursor && <span className="cursor">|</span>}</p>
      </div>
    </div>
  );
};

export default HomePage;
