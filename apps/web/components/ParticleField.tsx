"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";

export default function ParticleField() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // --- Particles ---
    const PARTICLE_COUNT = 600;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const speeds = new Float32Array(PARTICLE_COUNT);

    const palette = [
      new THREE.Color("#ffffff"), // bright white
      new THREE.Color("#e4e4e7"), // metallic silver-gray
      new THREE.Color("#71717a"), // muted gray
      new THREE.Color("#27272a"), // dark carbon gray
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;

      const color = palette[Math.floor(Math.random() * palette.length)]!;
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 2 + 0.5;
      speeds[i] = Math.random() * 0.002 + 0.0005;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    particleGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 3)
    );
    particleGeometry.setAttribute(
      "size",
      new THREE.BufferAttribute(sizes, 1)
    );

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform vec2 uMouse;

        void main() {
          vColor = color;

          vec3 pos = position;
          pos.x += sin(uTime * 0.2 + position.y * 0.5) * 0.1;
          pos.y += cos(uTime * 0.15 + position.x * 0.5) * 0.1;
          pos.z += sin(uTime * 0.1 + position.x * 0.3) * 0.08;

          // Mouse influence
          pos.x += uMouse.x * 0.2 * (1.0 - abs(position.z) / 4.0);
          pos.y += uMouse.y * 0.2 * (1.0 - abs(position.z) / 4.0);

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (2.5 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;

          vAlpha = 0.3 + 0.7 * (1.0 - abs(position.z) / 4.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = smoothstep(0.5, 0.1, dist) * vAlpha * 0.5;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // --- Connection lines ---
    const LINE_COUNT = 60;
    const linePositions = new Float32Array(LINE_COUNT * 6);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(linePositions, 3)
    );
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.04,
      blending: THREE.AdditiveBlending,
    });
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // --- Floating ring geometry ---
    const ringGeometry = new THREE.TorusGeometry(2.5, 0.005, 12, 80);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.06,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI * 0.55;
    scene.add(ring);

    const ring2Geometry = new THREE.TorusGeometry(3.2, 0.004, 12, 80);
    const ring2Material = new THREE.MeshBasicMaterial({
      color: 0x71717a,
      transparent: true,
      opacity: 0.04,
    });
    const ring2 = new THREE.Mesh(ring2Geometry, ring2Material);
    ring2.rotation.x = Math.PI * 0.35;
    ring2.rotation.y = Math.PI * 0.2;
    scene.add(ring2);

    // --- Mouse tracking ---
    const mouse = { x: 0, y: 0 };
    const targetMouse = { x: 0, y: 0 };

    const onMouseMove = (e: MouseEvent) => {
      targetMouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    // --- Resize ---
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // --- Animation loop ---
    let raf: number;
    const clock = new THREE.Clock();

    const animate = () => {
      raf = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Smooth mouse lerp
      mouse.x += (targetMouse.x - mouse.x) * 0.05;
      mouse.y += (targetMouse.y - mouse.y) * 0.05;

      if (particleMaterial.uniforms.uTime && particleMaterial.uniforms.uMouse) {
        particleMaterial.uniforms.uTime.value = elapsed;
        particleMaterial.uniforms.uMouse.value.set(mouse.x, mouse.y);
      }

      // Rotate ring slowly
      ring.rotation.z = elapsed * 0.08;
      ring2.rotation.z = -elapsed * 0.05;

      // Slight camera sway
      camera.position.x = mouse.x * 0.3;
      camera.position.y = mouse.y * 0.2;
      camera.lookAt(0, 0, 0);

      // Update connection lines
      const posAttr = particleGeometry.getAttribute("position") as THREE.BufferAttribute | undefined;
      if (posAttr) {
        const posArr = posAttr.array as Float32Array;
        let lineIdx = 0;
        for (let i = 0; i < Math.min(PARTICLE_COUNT, 100) && lineIdx < LINE_COUNT; i++) {
          for (let j = i + 1; j < Math.min(PARTICLE_COUNT, 100) && lineIdx < LINE_COUNT; j++) {
            const idxI3 = i * 3;
            const idxJ3 = j * 3;
            const xi = posArr[idxI3];
            const yi = posArr[idxI3 + 1];
            const zi = posArr[idxI3 + 2];
            const xj = posArr[idxJ3];
            const yj = posArr[idxJ3 + 1];
            const zj = posArr[idxJ3 + 2];

            if (xi !== undefined && yi !== undefined && zi !== undefined && xj !== undefined && yj !== undefined && zj !== undefined) {
              const dx = xi - xj;
              const dy = yi - yj;
              const dz = zi - zj;
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
              if (dist < 1.5) {
                linePositions[lineIdx * 6] = xi;
                linePositions[lineIdx * 6 + 1] = yi;
                linePositions[lineIdx * 6 + 2] = zi;
                linePositions[lineIdx * 6 + 3] = xj;
                linePositions[lineIdx * 6 + 4] = yj;
                linePositions[lineIdx * 6 + 5] = zj;
                lineIdx++;
              }
            }
          }
        }
        const linePosAttr = lineGeometry.getAttribute("position");
        if (linePosAttr) {
          linePosAttr.needsUpdate = true;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
      ring2Geometry.dispose();
      ring2Material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ background: "transparent" }}
    />
  );
}
