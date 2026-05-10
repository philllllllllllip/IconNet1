import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import './index.css';
import { useAuth } from './AuthContext';

const LoginPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

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

      particles.forEach(p => {
        p.y += p.d;
        if (p.y > canvas.height) {
          p.y = 0;
          p.x = Math.random() * canvas.width;
        }
      });

      requestAnimationFrame(draw);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Login failed';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden flex flex-col">
      <canvas id="particles" className="absolute inset-0 pointer-events-none" />

      <div className="flex justify-between items-center px-8 py-4 z-20 relative">
        <h1 className="navbar-title">ICONNET</h1>
        <div className="flex gap-4">
          <a href="/" className="extruded-btn">Home</a>
          <a href="/signup" className="extruded-btn">Register</a>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center z-10 relative">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="hero-title"
        >
          Welcome Back
        </motion.h1>

        <motion.p
          className="hero-description"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Login to IconNet
        </motion.p>

        <motion.form
          onSubmit={handleSubmit}
          className="auth-form"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
            className="auth-input"
          />

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="auth-input pr-10"
            />
            <button
              type="button"
              className="password-toggle absolute right-3 top-1/2 transform -translate-y-1/2"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <i className="fas fa-eye-slash"></i> : <i className="fas fa-eye"></i>}
            </button>
          </div>

          {error && (
            <p className="auth-error" style={{ textAlign: 'center' }}>{error}</p>
          )}

          <button
            type="submit"
            className="extruded-btn"
            disabled={loading}
            style={{ marginTop: '1rem' }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </motion.form>

        <motion.p
          className="hero-description"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={{ marginTop: '2rem', fontSize: '0.9rem' }}
        >
          Don't have an account? <a href="/signup" style={{ color: '#60a5fa' }}>Sign up</a>
        </motion.p>
      </div>

      <div className="absolute bottom-4 left-8 z-20">
        <p className="bottom-title">{title}{showCursor && <span className="cursor">|</span>}</p>
      </div>
    </div>
  );
};

export default LoginPage;
