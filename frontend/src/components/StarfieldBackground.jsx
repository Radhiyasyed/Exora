import React, { useEffect, useRef } from 'react';

export default function StarfieldBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Parallax mouse position
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e) => {
      targetMouseX = (e.clientX - width / 2) * 0.05;
      targetMouseY = (e.clientY - height / 2) * 0.05;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Generate 1,200 twinkling star nodes with different depth z values
    const starsCount = 1200;
    const stars = [];
    const colors = ['#ffffff', '#22d3ee', '#818cf8', '#c084fc', '#e0f2fe'];

    for (let i = 0; i < starsCount; i++) {
      stars.push({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * 1000 + 1,
        radius: Math.random() * 1.5 + 0.5,
        baseAlpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Animation Loop
    const render = (time) => {
      // Smoothly interpolate parallax mouse
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.fillStyle = '#030714';
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Move star z position towards viewer for light warp feeling
        star.z -= 0.15;
        if (star.z <= 0) {
          star.z = 1000;
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
        }

        // Parallax perspective projection
        const k = 400 / star.z;
        const px = (star.x + mouseX * (1000 / star.z)) * k + centerX;
        const py = (star.y + mouseY * (1000 / star.z)) * k + centerY;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const alpha =
            star.baseAlpha *
            (0.7 + 0.3 * Math.sin(time * star.twinkleSpeed + star.twinklePhase));
          const size = Math.max(0.5, star.radius * k * 0.8);

          ctx.save();
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.globalAlpha = Math.min(1, Math.max(0.1, alpha));
          ctx.shadowBlur = size > 1.2 ? 6 : 0;
          ctx.shadowColor = star.color;
          ctx.fill();
          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-20 w-full h-full"
    />
  );
}
