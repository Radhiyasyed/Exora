import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const EARTH_DIFFUSE = 'https://threejs.org/examples/textures/earth_atmos_2048.jpg';
const EARTH_BUMP = 'https://threejs.org/examples/textures/earthbump1k.jpg';

export default function Planet3DViewer({ planetColor = '#22d3ee', planetName = 'Exoplanet' }) {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 4.3);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.7;
    controls.zoomSpeed = 0.8;
    controls.minDistance = 2.5;
    controls.maxDistance = 7.0;

    const texW = 2048;
    const texH = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = texW;
    canvas.height = texH;
    const ctx = canvas.getContext('2d');

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = texW;
    bumpCanvas.height = texH;
    const bumpCtx = bumpCanvas.getContext('2d');

    const oceanGrad = ctx.createLinearGradient(0, 0, 0, texH);
    oceanGrad.addColorStop(0, '#031e2b');
    oceanGrad.addColorStop(0.3, '#0b3a42');
    oceanGrad.addColorStop(0.5, '#0891b2');
    oceanGrad.addColorStop(0.7, '#042f2e');
    oceanGrad.addColorStop(1, '#02182b');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, texW, texH);

    bumpCtx.fillStyle = '#000000';
    bumpCtx.fillRect(0, 0, texW, texH);

    const noise = (x, y) => {
      let v = Math.sin(x * 0.01) * Math.cos(y * 0.01);
      v += 0.5 * Math.sin(x * 0.02 + y * 0.015);
      v += 0.25 * Math.cos(x * 0.04 - y * 0.03);
      v += 0.125 * Math.sin(x * 0.08 + y * 0.07);
      return (v + 1.875) / 3.75;
    };

    const imgData = ctx.getImageData(0, 0, texW, texH);
    const bumpData = bumpCtx.getImageData(0, 0, texW, texH);
    const data = imgData.data;
    const bData = bumpData.data;

    for (let y = 0; y < texH; y++) {
      for (let x = 0; x < texW; x++) {
        const index = (y * texW + x) * 4;
        const n = noise(x, y);
        const poleDist = Math.abs(y - texH / 2) / (texH / 2);

        if (n > 0.48) {
          const elev = (n - 0.48) / 0.52;
          let r, g, b;

          if (elev < 0.25) {
            r = 5 + elev * 40;
            g = 150 + elev * 100;
            b = 105;
          } else if (elev < 0.6) {
            const t = (elev - 0.25) / 0.35;
            r = 4 + t * 213;
            g = 120 + t * 40;
            b = 87 - t * 40;
          } else {
            const t = (elev - 0.6) / 0.4;
            r = 217 + t * 38;
            g = 160 + t * 80;
            b = 47 + t * 90;
          }

          data[index] = r;
          data[index + 1] = g;
          data[index + 2] = b;
          const heightVal = Math.min(255, Math.floor(elev * 255));
          bData[index] = heightVal;
          bData[index + 1] = heightVal;
          bData[index + 2] = heightVal;
          bData[index + 3] = 255;
        }

        if (poleDist > 0.82) {
          const capIntensity = Math.min(1, (poleDist - 0.82) / 0.18);
          data[index] = Math.round(data[index] * (1 - capIntensity) + 240 * capIntensity);
          data[index + 1] = Math.round(data[index + 1] * (1 - capIntensity) + 250 * capIntensity);
          data[index + 2] = Math.round(data[index + 2] * (1 - capIntensity) + 255 * capIntensity);
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    bumpCtx.putImageData(bumpData, 0, 0);

    const defaultTexture = new THREE.CanvasTexture(canvas);
    defaultTexture.wrapS = THREE.RepeatWrapping;
    defaultTexture.wrapT = THREE.ClampToEdgeWrapping;

    const defaultBump = new THREE.CanvasTexture(bumpCanvas);
    defaultBump.wrapS = THREE.RepeatWrapping;
    defaultBump.wrapT = THREE.ClampToEdgeWrapping;

    const planetGeometry = new THREE.SphereGeometry(1.5, 64, 64);
    const planetMaterial = new THREE.MeshStandardMaterial({
      map: defaultTexture,
      bumpMap: defaultBump,
      bumpScale: 0.04,
      roughness: 0.5,
      metalness: 0.15,
    });

    const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
    scene.add(planetMesh);

    const isEarth = planetName?.toLowerCase().trim() === 'earth';
    if (isEarth) {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      loader.load(
        EARTH_DIFFUSE,
        (loadedTexture) => {
          planetMaterial.map = loadedTexture;
          planetMaterial.needsUpdate = true;
        },
        undefined,
        () => {
          console.warn('Earth diffuse texture failed to load, using procedural fallback.');
        }
      );
      loader.load(
        EARTH_BUMP,
        (loadedBump) => {
          planetMaterial.bumpMap = loadedBump;
          planetMaterial.needsUpdate = true;
        },
        undefined,
        () => {
          console.warn('Earth bump map failed to load, using procedural fallback.');
        }
      );
    }

    const atmosphereShader = {
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewVector = normalize(-vPosition);
          float intensity = pow(1.0 - abs(dot(vNormal, viewVector)), 2.5);
          vec3 atmosphereColor = mix(vec3(0.13, 0.83, 0.93), vec3(0.51, 0.55, 0.97), 0.5);
          gl_FragColor = vec4(atmosphereColor, intensity * 0.75);
        }
      `,
    };

    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: atmosphereShader.vertexShader,
      fragmentShader: atmosphereShader.fragmentShader,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });

    const atmosphereMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.62, 64, 64),
      atmosphereMaterial
    );
    scene.add(atmosphereMesh);

    const innerHazeMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#22d3ee'),
      transparent: true,
      opacity: 0.08,
      side: THREE.FrontSide,
    });

    const innerHazeMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.52, 64, 64),
      innerHazeMaterial
    );
    scene.add(innerHazeMesh);

    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.0);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 3.2);
    sunLight.position.set(6, 4, 5);
    scene.add(sunLight);

    const bounceLight = new THREE.DirectionalLight(0x0891b2, 0.8);
    bounceLight.position.set(-6, -2, -4);
    scene.add(bounceLight);

    let animId = null;
    const loop = () => {
      planetMesh.rotation.y += 0.0025;
      controls.update();
      renderer.render(scene, camera);
      animId = requestAnimationFrame(loop);
    };

    const startAnimation = () => {
      if (animId === null) {
        animId = requestAnimationFrame(loop);
      }
    };

    const stopAnimation = () => {
      if (animId !== null) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            startAnimation();
          } else {
            setIsVisible(false);
            stopAnimation();
          }
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(container);

    if (container.getBoundingClientRect().top < window.innerHeight && container.getBoundingClientRect().bottom > 0) {
      startAnimation();
    }

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      stopAnimation();
      controls.dispose();
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [planetColor, planetName]);

  return (
    <div className="relative w-full h-full min-h-[360px] flex items-center justify-center">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[12px] font-mono-data text-cyan-300 pointer-events-none shadow-xl flex items-center space-x-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
        <span>🖱 Click & Drag to Rotate 3D Globe • Scroll to Zoom</span>
      </div>
    </div>
  );    ctx.putImageData(imgData, 0, 0);
    bumpCtx.putImageData(bumpData, 0, 0);

    // Layer 2: Swirling Atmospheric Cloud Band Overlay
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#ffffff';

    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      const bandY = 100 + i * 75;
      ctx.moveTo(0, bandY);
      for (let x = 0; x <= texW; x += 40) {
        const dy = Math.sin(x * 0.008 + i) * 35 + Math.cos(x * 0.015) * 20;
        ctx.lineTo(x, bandY + dy);
      }
      ctx.lineTo(texW, bandY + 45);
      ctx.lineTo(0, bandY + 45);
      ctx.fill();
    }
    ctx.restore();

    // Textures initialization
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
    bumpTexture.wrapS = THREE.RepeatWrapping;
    bumpTexture.wrapT = THREE.ClampToEdgeWrapping;

    // 6. Realistic 3D Planet Mesh with Specular & Bump Materials
    const planetGeometry = new THREE.SphereGeometry(1.5, 64, 64);
    const planetMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      bumpMap: bumpTexture,
      bumpScale: 0.04,
      roughness: 0.5,
      metalness: 0.15,
    });
    const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
    scene.add(planetMesh);

    // 7. Glowing Indigo/Cyan Fresnel Atmosphere Shell (Double-layer rim glow)
    const atmosphereShader = {
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewVector = normalize(-vPosition);
          float intensity = pow(1.0 - abs(dot(vNormal, viewVector)), 2.5);
          vec3 atmosphereColor = mix(vec3(0.13, 0.83, 0.93), vec3(0.51, 0.55, 0.97), 0.5);
          gl_FragColor = vec4(atmosphereColor, intensity * 0.75);
        }
      `,
    };

    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: atmosphereShader.vertexShader,
      fragmentShader: atmosphereShader.fragmentShader,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });

    const atmosphereMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.62, 64, 64),
      atmosphereMaterial
    );
    scene.add(atmosphereMesh);

    // Inner subtle cyan haze
    const innerHazeMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#22d3ee'),
      transparent: true,
      opacity: 0.08,
      side: THREE.FrontSide,
    });
    const innerHazeMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.52, 64, 64),
      innerHazeMaterial
    );
    scene.add(innerHazeMesh);

    // 8. Dynamic Lighting (Sunlight highlights & realistic dark shadow side)
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.0);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 3.2);
    sunLight.position.set(6, 4, 5);
    scene.add(sunLight);

    // Secondary cyan bounce light for dark side detail
    const bounceLight = new THREE.DirectionalLight(0x0891b2, 0.8);
    bounceLight.position.set(-6, -2, -4);
    scene.add(bounceLight);

    // 9. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    // 10. Animation Loop
    let animId;
      useEffect(() => {
    const animate = () => {
      planetMesh.rotation.y += 0.0025; // Gentle axial rotation
      controls.update();
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      controls.dispose();
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [planetColor, planetName]);

  return (
    <div className="relative w-full h-full min-h-[360px] flex items-center justify-center">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[12px] font-mono-data text-cyan-300 pointer-events-none shadow-xl flex items-center space-x-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
        <span>🖱 Click & Drag to Rotate 3D Globe • Scroll to Zoom</span>
      </div>
    </div>
  );
}
