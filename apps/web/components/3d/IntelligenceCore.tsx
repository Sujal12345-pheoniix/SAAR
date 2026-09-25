'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, Trail, Stars } from '@react-three/drei';
import * as THREE from 'three';

/* ---- Orbital Ring ---- */
function OrbitalRing({ radius, tilt, speed, color }: { radius: number; tilt: number; speed: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z = state.clock.elapsedTime * speed;
  });

  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
    }
    return pts;
  }, [radius]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  return (
    <group rotation={[tilt, 0, 0]}>
      <primitive object={new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35, linewidth: 1 })
      )} ref={ref} />
    </group>
  );
}

/* ---- Orbital Node (glowing dot on ring) ---- */
function OrbitalNode({ radius, tilt, speed, offset, color }: { radius: number; tilt: number; speed: number; offset: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed + offset;
    const x = Math.cos(t) * radius;
    const y = Math.sin(t) * radius;
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);
    ref.current.position.set(x, y * cosT, y * sinT);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.045, 8, 8]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
    </mesh>
  );
}

/* ---- Particle Field ---- */
function Particles({ count = 200 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 1.8 + Math.random() * 2.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.04;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.02) * 0.1;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.025} color="#6366F1" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

/* ---- Core Sphere ---- */
function CoreSphere({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.12 + mouseX * 0.5;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.07) * 0.2 + mouseY * 0.3;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.55, 64, 64]} />
        <MeshDistortMaterial
          color="#6366F1"
          emissive="#4338CA"
          emissiveIntensity={0.4}
          distort={0.25}
          speed={1.5}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
}

/* ---- Mouse-reactive Camera rig ---- */
function CameraRig({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  const { camera } = useThree();
  useFrame(() => {
    camera.position.x += (mouseX * 0.8 - camera.position.x) * 0.04;
    camera.position.y += (-mouseY * 0.8 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/* ---- Scene ---- */
function Scene({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[3, 3, 3]} intensity={2} color="#6366F1" />
      <pointLight position={[-3, -2, 2]} intensity={1} color="#8B5CF6" />
      <pointLight position={[0, -3, -2]} intensity={0.5} color="#06B6D4" />

      <CoreSphere mouseX={mouseX} mouseY={mouseY} />

      <OrbitalRing radius={1.0} tilt={Math.PI * 0.15} speed={0.18} color="#6366F1" />
      <OrbitalRing radius={1.35} tilt={Math.PI * 0.45} speed={-0.12} color="#8B5CF6" />
      <OrbitalRing radius={1.7} tilt={Math.PI * 0.28} speed={0.09} color="#06B6D4" />

      <OrbitalNode radius={1.0} tilt={Math.PI * 0.15} speed={0.18} offset={0} color="#818CF8" />
      <OrbitalNode radius={1.0} tilt={Math.PI * 0.15} speed={0.18} offset={Math.PI} color="#A5B4FC" />
      <OrbitalNode radius={1.35} tilt={Math.PI * 0.45} speed={-0.12} offset={1.2} color="#C4B5FD" />
      <OrbitalNode radius={1.35} tilt={Math.PI * 0.45} speed={-0.12} offset={4.0} color="#8B5CF6" />
      <OrbitalNode radius={1.7} tilt={Math.PI * 0.28} speed={0.09} offset={2.5} color="#67E8F9" />

      <Particles count={220} />
      <CameraRig mouseX={mouseX} mouseY={mouseY} />
    </>
  );
}

/* ---- Main Export ---- */
interface IntelligenceCoreProps {
  mouseX?: number;
  mouseY?: number;
}

export function IntelligenceCore({ mouseX = 0, mouseY = 0 }: IntelligenceCoreProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.5], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
      style={{ background: 'transparent' }}
    >
      <Scene mouseX={mouseX} mouseY={mouseY} />
    </Canvas>
  );
}
