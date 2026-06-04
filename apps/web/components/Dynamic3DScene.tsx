"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";

interface Dynamic3DSceneProps {
  activeFeatureIndex: number;
  scrollProgress: number;
}

export default function Dynamic3DScene({
  activeFeatureIndex,
  scrollProgress,
}: Dynamic3DSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    // --- Scene Setup ---
    const scene = new THREE.Scene();

    // Perspective Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 8;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.5, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0xffffff, 0.5, 30);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    // Helper to generate a transparent material
    const createLineMaterial = (color: number, opacity: number = 0.3) => {
      return new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
      });
    };

    const createPointsMaterial = (color: number, size: number = 0.05) => {
      // Create a simple circular canvas texture for round points
      const canvas = document.createElement("canvas");
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        grad.addColorStop(0, "rgba(255, 255, 255, 1)");
        grad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 16, 16);
      }
      const texture = new THREE.CanvasTexture(canvas);

      return new THREE.PointsMaterial({
        color,
        size,
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
    };

    // --- Setup Groups for Transitions ---
    const groups: THREE.Group[] = [];
    const featureCount = 6;

    // Create a group for each feature state (including Hero/Default as state -1)
    // Indexes: -1 = Hero, 0 = AI Match, 1 = Smart Dir, 2 = Scheduling, 3 = Reputation, 4 = Alerts, 5 = Study Guides
    for (let i = -1; i < featureCount; i++) {
      const g = new THREE.Group();
      g.visible = i === activeFeatureIndex;
      // Store current animated opacity inside userdata for easy lerping
      g.userData = { opacity: i === activeFeatureIndex ? 1 : 0 };
      scene.add(g);
      groups.push(g);
    }

    // Reference mappings for groups:
    // groups[0] = Index -1 (Hero)
    // groups[1] = Index 0  (AI Matching)
    // groups[2] = Index 1  (Smart Directory)
    // groups[3] = Index 2  (Scheduling)
    // groups[4] = Index 3  (Reputation)
    // groups[5] = Index 4  (Alerts)
    // groups[6] = Index 5  (Study Guides)

    // ==========================================
    // HERO GROUP (Index -1) -> Network Globe / Icosahedron
    // ==========================================
    const heroGroup = groups[0]!;
    const heroGeom = new THREE.IcosahedronGeometry(2.2, 2);
    
    // Wireframe Mesh
    const heroWireframeMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    });
    const heroMesh = new THREE.Mesh(heroGeom, heroWireframeMat);
    heroGroup.add(heroMesh);

    // Points Cloud
    const heroPointsMat = createPointsMaterial(0x9ca3af, 0.08);
    const heroPoints = new THREE.Points(heroGeom, heroPointsMat);
    heroGroup.add(heroPoints);

    // Dynamic inner lines
    const heroInnerGeom = new THREE.IcosahedronGeometry(1.6, 1);
    const heroInnerMat = createLineMaterial(0x71717a, 0.2);
    const heroInnerLines = new THREE.LineSegments(
      new THREE.WireframeGeometry(heroInnerGeom),
      heroInnerMat
    );
    heroGroup.add(heroInnerLines);

    // ==========================================
    // 0. AI MATCHING (Index 0) -> Two Orbiting, Connecting Nodes
    // ==========================================
    const aiGroup = groups[1]!;
    
    // Core nodes
    const nodeGeom = new THREE.SphereGeometry(0.3, 16, 16);
    const nodeMat1 = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true });
    const nodeMat2 = new THREE.MeshBasicMaterial({ color: 0x71717a, transparent: true });

    const nodeA = new THREE.Mesh(nodeGeom, nodeMat1);
    const nodeB = new THREE.Mesh(nodeGeom, nodeMat2);
    aiGroup.add(nodeA);
    aiGroup.add(nodeB);

    // Orbit rings
    const orbitGeom = new THREE.TorusGeometry(1.5, 0.01, 8, 64);
    const orbitMat = createLineMaterial(0xffffff, 0.1);
    const orbit1 = new THREE.Mesh(orbitGeom, orbitMat);
    const orbit2 = new THREE.Mesh(orbitGeom, orbitMat);
    orbit1.rotation.x = Math.PI / 2;
    orbit2.rotation.y = Math.PI / 2;
    aiGroup.add(orbit1);
    aiGroup.add(orbit2);

    // Connection line
    const connLineGeom = new THREE.BufferGeometry();
    const connLinePos = new Float32Array(6); // 2 points * 3 coords
    connLineGeom.setAttribute("position", new THREE.BufferAttribute(connLinePos, 3));
    const connLineMat = createLineMaterial(0xffffff, 0.6);
    const connectionLine = new THREE.Line(connLineGeom, connLineMat);
    aiGroup.add(connectionLine);

    // Inner orbital dust
    const dustCount = 40;
    const dustGeom = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let d = 0; d < dustCount; d++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = 1.0 + Math.random() * 0.8;
      dustPos[d * 3] = r * Math.sin(phi) * Math.cos(theta);
      dustPos[d * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      dustPos[d * 3 + 2] = r * Math.cos(phi);
    }
    dustGeom.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dustPoints = new THREE.Points(dustGeom, createPointsMaterial(0x71717a, 0.06));
    aiGroup.add(dustPoints);

    // ==========================================
    // 1. SMART DIRECTORY (Index 1) -> Grid Cylinder / Matrix Cloud
    // ==========================================
    const dirGroup = groups[2]!;
    const cylinderGeom = new THREE.CylinderGeometry(1.6, 1.6, 3, 12, 6, true);
    
    // Wireframe grid lines
    const dirWireMat = createLineMaterial(0xffffff, 0.1);
    const dirWire = new THREE.LineSegments(
      new THREE.WireframeGeometry(cylinderGeom),
      dirWireMat
    );
    dirGroup.add(dirWire);

    // Grid points
    const dirPointsMat = createPointsMaterial(0x71717a, 0.08);
    const dirPoints = new THREE.Points(cylinderGeom, dirPointsMat);
    dirGroup.add(dirPoints);

    // Highlight horizontal rings
    const ringGeom = new THREE.TorusGeometry(1.6, 0.015, 8, 32);
    const ringMat = createLineMaterial(0xffffff, 0.25);
    const ringTop = new THREE.Mesh(ringGeom, ringMat);
    const ringMid = new THREE.Mesh(ringGeom, ringMat);
    const ringBottom = new THREE.Mesh(ringGeom, ringMat);
    ringTop.position.y = 1.0;
    ringTop.rotation.x = Math.PI / 2;
    ringMid.position.y = 0;
    ringMid.rotation.x = Math.PI / 2;
    ringBottom.position.y = -1.0;
    ringBottom.rotation.x = Math.PI / 2;
    dirGroup.add(ringTop);
    dirGroup.add(ringMid);
    dirGroup.add(ringBottom);

    // ==========================================
    // 2. SCHEDULING (Index 2) -> Intersecting Clockwork Rings
    // ==========================================
    const schedGroup = groups[3]!;

    // Inner clock face
    const innerRingGeom = new THREE.RingGeometry(1.2, 1.25, 32);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0x71717a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.15,
    });
    const innerClockFace = new THREE.Mesh(innerRingGeom, innerRingMat);
    schedGroup.add(innerClockFace);

    // Outermost time loop
    const outerLoopGeom = new THREE.TorusGeometry(1.8, 0.02, 8, 64);
    const outerLoopMat = createLineMaterial(0xffffff, 0.3);
    const outerTimeLoop = new THREE.Mesh(outerLoopGeom, outerLoopMat);
    schedGroup.add(outerTimeLoop);

    // Orbital hands
    const handGeom = new THREE.BufferGeometry();
    const handPos = new Float32Array([0, 0, 0, 0, 1.2, 0, 0, 0, 0, 0.8, -0.4, 0]);
    handGeom.setAttribute("position", new THREE.BufferAttribute(handPos, 3));
    const handMat = createLineMaterial(0xffffff, 0.5);
    const hands = new THREE.LineSegments(handGeom, handMat);
    schedGroup.add(hands);

    // Ring decorators (tick marks)
    const tickCount = 12;
    const ticksGeom = new THREE.BufferGeometry();
    const ticksPos = new Float32Array(tickCount * 6);
    for (let t = 0; t < tickCount; t++) {
      const angle = (t / tickCount) * Math.PI * 2;
      const x1 = Math.cos(angle) * 1.6;
      const y1 = Math.sin(angle) * 1.6;
      const x2 = Math.cos(angle) * 1.7;
      const y2 = Math.sin(angle) * 1.7;
      
      ticksPos[t * 6] = x1;
      ticksPos[t * 6 + 1] = y1;
      ticksPos[t * 6 + 2] = 0;
      ticksPos[t * 6 + 3] = x2;
      ticksPos[t * 6 + 4] = y2;
      ticksPos[t * 6 + 5] = 0;
    }
    ticksGeom.setAttribute("position", new THREE.BufferAttribute(ticksPos, 3));
    const ticks = new THREE.LineSegments(ticksGeom, createLineMaterial(0x71717a, 0.3));
    schedGroup.add(ticks);

    // ==========================================
    // 3. REPUTATION SYSTEM (Index 3) -> Ascending Pyramid Levels
    // ==========================================
    const repGroup = groups[4]!;
    
    // Stacked tiers (squares in 3D)
    const tierCount = 4;
    const tierMeshes: THREE.LineLoop[] = [];
    for (let tr = 0; tr < tierCount; tr++) {
      const hLevel = -1.2 + (tr / (tierCount - 1)) * 2.4;
      const size = 1.8 - (tr / (tierCount - 1)) * 1.2;
      const half = size / 2;
      
      const vertices = new Float32Array([
        -half, hLevel, -half,
         half, hLevel, -half,
         half, hLevel,  half,
        -half, hLevel,  half,
        -half, hLevel, -half,
      ]);
      const trGeom = new THREE.BufferGeometry();
      trGeom.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
      
      const trMat = createLineMaterial(tr === tierCount - 1 ? 0xffffff : 0x71717a, 0.2 + tr * 0.1);
      const trMesh = new THREE.LineLoop(trGeom, trMat);
      repGroup.add(trMesh);
      tierMeshes.push(trMesh);
    }

    // Central core pillar
    const coreGeom = new THREE.CylinderGeometry(0.01, 0.1, 2.6, 8, 1);
    const coreMat = createLineMaterial(0xffffff, 0.15);
    const corePillar = new THREE.LineSegments(
      new THREE.WireframeGeometry(coreGeom),
      coreMat
    );
    repGroup.add(corePillar);

    // Rising feedback particles
    const repParticleCount = 15;
    const repParticleGeom = new THREE.BufferGeometry();
    const repParticlePos = new Float32Array(repParticleCount * 3);
    const repParticleSpeeds = new Float32Array(repParticleCount);
    for (let rp = 0; rp < repParticleCount; rp++) {
      repParticlePos[rp * 3] = (Math.random() - 0.5) * 1.2;
      repParticlePos[rp * 3 + 1] = (Math.random() - 0.5) * 2.4;
      repParticlePos[rp * 3 + 2] = (Math.random() - 0.5) * 1.2;
      repParticleSpeeds[rp] = 0.01 + Math.random() * 0.015;
    }
    repParticleGeom.setAttribute("position", new THREE.BufferAttribute(repParticlePos, 3));
    const repParticles = new THREE.Points(repParticleGeom, createPointsMaterial(0xffffff, 0.08));
    repGroup.add(repParticles);

    // ==========================================
    // 4. REAL-TIME ALERTS (Index 4) -> Ripple spheres expanding
    // ==========================================
    const alertGroup = groups[5]!;

    // Core pulsing beacon
    const beaconGeom = new THREE.SphereGeometry(0.4, 16, 16);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      wireframe: true,
    });
    const beacon = new THREE.Mesh(beaconGeom, beaconMat);
    alertGroup.add(beacon);

    // Ripple spheres
    const waveCount = 3;
    const ripples: THREE.Mesh[] = [];
    const rippleGeom = new THREE.SphereGeometry(1, 16, 12);
    for (let w = 0; w < waveCount; w++) {
      const ripMat = new THREE.MeshBasicMaterial({
        color: 0x71717a,
        wireframe: true,
        transparent: true,
        opacity: 0.1,
      });
      const rip = new THREE.Mesh(rippleGeom, ripMat);
      // Stagger initial scales
      rip.scale.setScalar(0.4 + (w / waveCount) * 2.0);
      alertGroup.add(rip);
      ripples.push(rip);
    }

    // Pulse sensor signals
    const alertLineGeom = new THREE.BufferGeometry();
    const alertLinesCount = 12;
    const alertLinePos = new Float32Array(alertLinesCount * 6);
    for (let al = 0; al < alertLinesCount; al++) {
      const theta = (al / alertLinesCount) * Math.PI * 2;
      alertLinePos[al * 6] = 0;
      alertLinePos[al * 6 + 1] = 0;
      alertLinePos[al * 6 + 2] = 0;
      alertLinePos[al * 6 + 3] = Math.cos(theta) * 2.2;
      alertLinePos[al * 6 + 4] = Math.sin(theta) * 2.2;
      alertLinePos[al * 6 + 5] = 0;
    }
    alertLineGeom.setAttribute("position", new THREE.BufferAttribute(alertLinePos, 3));
    const alertLines = new THREE.LineSegments(alertLineGeom, createLineMaterial(0xffffff, 0.1));
    alertGroup.add(alertLines);

    // ==========================================
    // 5. AI STUDY GUIDES (Index 5) -> Unfolding Cube / Book Grid
    // ==========================================
    const guideGroup = groups[6]!;

    // Main structural box
    const boxGeom = new THREE.BoxGeometry(1.8, 1.8, 1.8, 2, 2, 2);
    const boxWireMat = createLineMaterial(0xffffff, 0.25);
    const boxLines = new THREE.LineSegments(
      new THREE.WireframeGeometry(boxGeom),
      boxWireMat
    );
    guideGroup.add(boxLines);

    // Glowing coordinate joints
    const boxPoints = new THREE.Points(boxGeom, createPointsMaterial(0x71717a, 0.09));
    guideGroup.add(boxPoints);

    // Inner orbiting core document node
    const innerDocGeom = new THREE.IcosahedronGeometry(0.8, 1);
    const innerDocMat = createLineMaterial(0xffffff, 0.15);
    const innerDoc = new THREE.LineSegments(
      new THREE.WireframeGeometry(innerDocGeom),
      innerDocMat
    );
    guideGroup.add(innerDoc);

    // Floating data sheets (grids)
    const sheetGeom = new THREE.PlaneGeometry(0.6, 0.6, 2, 2);
    const sheetWire = new THREE.WireframeGeometry(sheetGeom);
    const sheetMat = createLineMaterial(0x71717a, 0.2);
    
    const sheet1 = new THREE.LineSegments(sheetWire, sheetMat);
    const sheet2 = new THREE.LineSegments(sheetWire, sheetMat);
    sheet1.position.set(-1.4, 1.2, 0.5);
    sheet2.position.set(1.4, -1.2, -0.5);
    guideGroup.add(sheet1);
    guideGroup.add(sheet2);

    // ==========================================
    // Mouse Interaction
    // ==========================================
    const mouse = { x: 0, y: 0 };
    const targetMouse = { x: 0, y: 0 };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      targetMouse.x = (x / width - 0.5) * 2;
      targetMouse.y = -(y / height - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    // --- Resize ---
    const onResize = () => {
      const w = container.clientWidth || 500;
      const h = container.clientHeight || 500;
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

      // Smooth mouse lerping
      mouse.x += (targetMouse.x - mouse.x) * 0.05;
      mouse.y += (targetMouse.y - mouse.y) * 0.05;

      // Global scene rotation based on scroll and time
      scene.rotation.y = elapsed * 0.1 + scrollProgress * 0.8;
      scene.rotation.x = mouse.y * 0.2;
      scene.rotation.z = mouse.x * 0.1;

      // Track active group mappings:
      // groups[activeFeatureIndex + 1] should have opacity = 1, others = 0
      const activeGroupIndex = activeFeatureIndex + 1; // Maps -1 to 0, 0 to 1, etc.

      for (let i = 0; i < groups.length; i++) {
        const group = groups[i]!;
        const targetOpacity = i === activeGroupIndex ? 1 : 0;
        
        // Lerp opacity value
        group.userData.opacity += (targetOpacity - group.userData.opacity) * 0.08;
        
        if (group.userData.opacity > 0.01) {
          group.visible = true;
          // Apply opacity recursively to materials
          group.traverse((child) => {
            if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments || child instanceof THREE.Line || child instanceof THREE.Points || child instanceof THREE.LineLoop) {
              const mat = child.material as THREE.Material;
              if (mat) {
                mat.transparent = true;
                // Base opacity from original design * group transitions
                const baseOpacity = mat.userData.baseOpacity !== undefined ? mat.userData.baseOpacity : mat.opacity;
                if (mat.userData.baseOpacity === undefined) {
                  mat.userData.baseOpacity = mat.opacity; // cache initial
                }
                mat.opacity = baseOpacity * group.userData.opacity;
              }
            }
          });
        } else {
          group.visible = false;
        }
      }

      // --- Custom animations per group ---

      // 0. Hero globe rotation
      heroMesh.rotation.y = elapsed * 0.05;
      heroInnerLines.rotation.y = -elapsed * 0.1;

      // 1. AI matching orbit and line
      if (groups[1]!.visible) {
        const orbitalTime = elapsed * 0.6;
        const xDist = 1.3 + Math.sin(orbitalTime) * 0.3;
        const zDist = Math.cos(orbitalTime) * 1.0;
        
        nodeA.position.set(xDist, 0, zDist);
        nodeB.position.set(-xDist, 0, -zDist);
        
        // Pulsate nodes size
        const nodePulse = 1.0 + Math.sin(elapsed * 5.0) * 0.08;
        nodeA.scale.setScalar(nodePulse);
        nodeB.scale.setScalar(nodePulse);

        // Update connection line
        const posAttr = connectionLine.geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
        if (posAttr) {
          posAttr.setXYZ(0, nodeA.position.x, nodeA.position.y, nodeA.position.z);
          posAttr.setXYZ(1, nodeB.position.x, nodeB.position.y, nodeB.position.z);
          posAttr.needsUpdate = true;
        }
      }

      // 2. Cylinder directory grid
      if (groups[2]!.visible) {
        dirWire.rotation.y = -elapsed * 0.08;
        dirPoints.rotation.y = -elapsed * 0.08;
        ringTop.rotation.z = elapsed * 0.2;
        ringBottom.rotation.z = -elapsed * 0.2;
      }

      // 3. Scheduling hands and clock orbit
      if (groups[3]!.visible) {
        innerClockFace.rotation.z = -elapsed * 0.05;
        outerTimeLoop.rotation.y = elapsed * 0.15;
        outerTimeLoop.rotation.x = elapsed * 0.08;
        hands.rotation.z = -elapsed * 0.4;
      }

      // 4. Reputation system rising feedback and square rotates
      if (groups[4]!.visible) {
        tierMeshes.forEach((mesh, idx) => {
          mesh.rotation.y = elapsed * 0.06 * (idx % 2 === 0 ? 1 : -1);
        });

        // Rise feedback points
        const posAttr = repParticles.geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
        if (posAttr) {
          const rPos = posAttr.array as Float32Array;
          for (let rp = 0; rp < repParticleCount; rp++) {
            const idxY = rp * 3 + 1;
            const idxX = rp * 3;
            const idxZ = rp * 3 + 2;
            
            const currentY = rPos[idxY];
            const speed = repParticleSpeeds[rp];
            
            if (currentY !== undefined && speed !== undefined) {
              let newY = currentY + speed;
              if (newY > 1.2) {
                newY = -1.2;
                rPos[idxX] = (Math.random() - 0.5) * 1.2;
                rPos[idxZ] = (Math.random() - 0.5) * 1.2;
              }
              rPos[idxY] = newY;
            }
          }
          posAttr.needsUpdate = true;
        }
      }

      // 5. Alerts pulse expansions
      if (groups[5]!.visible) {
        const beaconPulse = 1.0 + Math.sin(elapsed * 4.0) * 0.15;
        beacon.scale.setScalar(beaconPulse);

        ripples.forEach((rip, rIdx) => {
          // Accelerating scale
          let scale = rip.scale.x + 0.015;
          if (scale > 2.2) {
            scale = 0.4; // Reset to beacon bounds
          }
          rip.scale.setScalar(scale);

          // Smooth fade out towards bounds
          const mat = rip.material as THREE.MeshBasicMaterial;
          const progress = (scale - 0.4) / 1.8; // 0 to 1
          mat.opacity = (1.0 - progress) * 0.15 * groups[5]!.userData.opacity;
        });

        alertLines.rotation.z = elapsed * 0.03;
      }

      // 6. Study guides folding boxes
      if (groups[6]!.visible) {
        boxLines.rotation.y = elapsed * 0.1;
        boxLines.rotation.x = elapsed * 0.05;
        boxPoints.rotation.y = elapsed * 0.1;
        boxPoints.rotation.x = elapsed * 0.05;
        
        innerDoc.rotation.y = -elapsed * 0.2;
        innerDoc.rotation.z = elapsed * 0.1;

        const pulseScale = 1.0 + Math.sin(elapsed * 1.5) * 0.1;
        innerDoc.scale.setScalar(pulseScale);

        // Hover effect for floating document sheets
        sheet1.position.y = 1.2 + Math.sin(elapsed * 2.0) * 0.08;
        sheet2.position.y = -1.2 + Math.cos(elapsed * 2.0) * 0.08;
        sheet1.rotation.y = elapsed * 0.2;
        sheet2.rotation.y = -elapsed * 0.2;
      }

      renderer.render(scene, camera);
    };

    animate();

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      
      // Dispose geometries & materials
      const disposeNode = (node: any) => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
          if (Array.isArray(node.material)) {
            node.material.forEach((mat: THREE.Material) => mat.dispose());
          } else {
            node.material.dispose();
          }
        }
      };
      
      scene.traverse(disposeNode);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [activeFeatureIndex]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: "transparent" }}
    />
  );
}
