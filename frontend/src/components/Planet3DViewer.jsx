import React, { useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';

/**
 * Subtle Planet Surface Texture Generator
 * Creates a clean, faint atmospheric ribbon texture across 1024x512 canvas.
 */
export function useSubtlePlanetTexture(status) {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    let base = '#ea580c'; // Too Hot (Kepler-452b)
    let dark = '#7c2d12';
    let light = '#f97316';

    if (status === 'Habitable Zone' || status === 'HZ Candidate') {
      base = '#16a34a';
      dark = '#14532d';
      light = '#22c55e';
    } else if (status === 'Too Cold') {
      base = '#0284c7';
      dark = '#075985';
      light = '#38bdf8';
    }

    // Base background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, dark);
    grad.addColorStop(0.5, base);
    grad.addColorStop(1, dark);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 4-5 very subtle horizontal wave bands (low opacity)
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = light;
      ctx.globalAlpha = 0.14 + (i % 2) * 0.06;
      ctx.beginPath();
      const y = 75 + i * 85;
      ctx.moveTo(0, y);
      for (let x = 0; x <= canvas.width; x += 32) {
        const wave = Math.sin(x * 0.015 + i * 1.4) * 16;
        ctx.lineTo(x, y + wave);
      }
      ctx.lineTo(canvas.width, y + 42);
      for (let x = canvas.width; x >= 0; x -= 32) {
        const wave = Math.sin(x * 0.015 + i * 1.4) * 16;
        ctx.lineTo(x, y + 42 + wave);
      }
      ctx.closePath();
      ctx.fill();
    }

    ctx.globalAlpha = 1.0;
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, [status]);
}

/**
 * Genuine 3D Planetary Sphere Component using Three.js WebGL
 * 
 * Features:
 * - Subtle atmosphere ribbons via CanvasTexture
 * - Soft specular shine & curvature depth (roughness: 0.42, metalness: 0.12)
 * - Three-point lighting (Key directional light, Ambient fill, Crescent rim point light)
 * - Continuous smooth rotation & interactive drag/zoom
 */
export default function Planet3DViewer({ 
  planet = {}, 
  isHero = false,
  compact = false,
  size,
  colorTheme,
  className = ''
}) {
  const mountRef = useRef(null);
  const canvasRef = useRef(null);

  // Extract Habitable Zone status, HZD & temperature
  const rawStatus = (planet?.zoneStatus || planet?.hzStatus || planet?.hzdStatus || '').toLowerCase().trim();
  const hzdVal = planet?.hzd != null ? Number(planet.hzd) : null;
  const rawTemp = planet?.equilibriumTempK ?? planet?.eqTempK ?? planet?.tempK;
  const tempK = rawTemp != null ? Number(rawTemp) : null;

  // Resolve normalized planet status label
  const planetStatus = useMemo(() => {
    const requestedTheme = (colorTheme || planet?.colorTheme || '').toLowerCase().trim();
    if (isHero) return 'Too Cold';
    if (
      requestedTheme === 'red' || 
      requestedTheme === 'orange' || 
      rawStatus.includes('hot') || 
      (hzdVal !== null && hzdVal < -1.0) ||
      (rawStatus === '' && tempK !== null && tempK > 350)
    ) {
      return 'Too Hot';
    }
    if (
      requestedTheme === 'blue' || 
      requestedTheme === 'cyan' || 
      rawStatus.includes('cold') || 
      (hzdVal !== null && hzdVal > 1.0) ||
      (rawStatus === '' && tempK !== null && tempK < 200)
    ) {
      return 'Too Cold';
    }
    return 'Habitable Zone';
  }, [isHero, colorTheme, planet?.colorTheme, rawStatus, hzdVal, tempK]);

  // Hook-generated subtle canvas texture
  const texture = useSubtlePlanetTexture(planetStatus);

  // Dynamic Theme Styling (Glow & Crescent Rim Light Colors)
  const theme = useMemo(() => {
    if (planetStatus === 'Too Hot') {
      return {
        rimColor: '#fed7aa',
        glowColor: 'rgba(234, 88, 12, 0.3)',
      };
    }
    if (planetStatus === 'Too Cold') {
      return {
        rimColor: '#bae6fd',
        glowColor: 'rgba(2, 132, 199, 0.3)',
      };
    }
    return {
      rimColor: '#bbf7d0',
      glowColor: 'rgba(34, 197, 94, 0.3)',
    };
  }, [planetStatus]);

  // Drag interaction state
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0.15, y: 0.5 });
  const [zoom, setZoom] = useState(1.0);

  // Sizing: Default is ~320px for detail (~75-80% of card), ~240px for hero, ~44px compact
  const s = size ? size : (compact ? 44 : (isHero ? 240 : 320));

  // Three.js WebGL Lifecycle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 2.8;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(s, s);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    } catch (e) {
      console.error('WebGL initialization error:', e);
      return;
    }

    // 2. Geometry & MeshStandardMaterial with map={texture}
    const geometry = new THREE.SphereGeometry(1.0, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.42,
      metalness: 0.12,
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // 3. Three-Point Lighting Setup (Soft Shine + Rim Glow)
    // Key Directional Light (Soft upper-right specular shine)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(4, 2.5, 3.5);
    scene.add(keyLight);

    // Ambient Light (Soft shadow fill)
    const fillLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(fillLight);

    // Crescent Rim Light (Atmospheric edge glow on lower-left)
    const rimLight = new THREE.PointLight(theme.rimColor, 1.2);
    rimLight.position.set(-3.5, -2.5, -1.5);
    scene.add(rimLight);

    // 4. Continuous Smooth Rotation & Animation Loop
    let animId;
    let lastTime = performance.now();
    const render = (now) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (!isDraggingRef.current) {
        rotationRef.current.y += (delta || 0.016) * 0.15;
      }
      sphere.rotation.x = rotationRef.current.x;
      sphere.rotation.y = rotationRef.current.y;
      renderer.render(scene, camera);
      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [s, texture, theme]);

  // Pointer Drag Handlers
  const handleMouseDown = (e) => {
    if (compact) return;
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || compact) return;
    const deltaX = e.clientX - lastMouseRef.current.x;
    const deltaY = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };

    rotationRef.current.x = Math.max(-0.8, Math.min(0.8, rotationRef.current.x - deltaY * 0.006));
    rotationRef.current.y += deltaX * 0.008;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e) => {
    if (compact) return;
    e.preventDefault();
    setZoom((prev) => Math.max(0.8, Math.min(1.25, prev - e.deltaY * 0.0015)));
  };

  return (
    <div 
      ref={mountRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className={`relative flex items-center justify-center select-none overflow-visible ${className} ${compact ? '' : 'cursor-grab active:cursor-grabbing'}`}
    >
      {/* Zoom / Scaling Container */}
      <div 
        className="relative flex items-center justify-center flex-shrink-0 transition-transform duration-75 ease-out"
        style={{ transform: `scale(${zoom})` }}
      >
        {/* Soft Outer Ambient Atmosphere Glow (Circular, No Solid Border Line) */}
        <div 
          className="absolute rounded-full pointer-events-none transition-all duration-500"
          style={{
            width: s * 1.35,
            height: s * 1.35,
            background: `radial-gradient(circle, ${theme.glowColor} 0%, transparent 70%)`,
            filter: compact ? 'blur(6px)' : 'blur(24px)',
          }}
        />

        {/* Genuine Three.js 3D WebGL Canvas Sphere */}
        <canvas 
          ref={canvasRef}
          width={s}
          height={s}
          className="rounded-full relative flex-shrink-0"
          style={{
            width: `${s}px`,
            height: `${s}px`,
            aspectRatio: '1 / 1',
            borderRadius: '50%',
          }}
        />
      </div>
    </div>
  );
}
