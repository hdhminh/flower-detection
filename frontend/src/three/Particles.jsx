import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function FloatingPetals({ count = 150 }) {
  const mesh = useRef();

  // Create random initial positions and velocities for floating petals
  const [positions, rotations, scales, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const rot = new Float32Array(count * 3);
    const scl = new Float32Array(count * 3);
    const spd = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = Math.random() * 12 - 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 16;

      rot[i * 3] = Math.random() * Math.PI;
      rot[i * 3 + 1] = Math.random() * Math.PI;
      rot[i * 3 + 2] = Math.random() * Math.PI;

      const scale = 0.08 + Math.random() * 0.12;
      scl[i * 3] = scale * 1.5;
      scl[i * 3 + 1] = scale;
      scl[i * 3 + 2] = scale * 0.3;

      spd[i * 3] = (Math.random() - 0.5) * 0.01;      // x drift
      spd[i * 3 + 1] = -0.012 - Math.random() * 0.015; // fall speed
      spd[i * 3 + 2] = 0.005 + Math.random() * 0.01;   // z sway
    }
    return [pos, rot, scl, spd];
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      // Update Y (falling)
      positions[i * 3 + 1] += speeds[i * 3 + 1];
      // Sway X and Z with sine wave
      positions[i * 3] += Math.sin(time + i) * 0.008;
      positions[i * 3 + 2] += Math.cos(time * 0.8 + i) * 0.006;

      // Wrap around when falling below ground
      if (positions[i * 3 + 1] < -3) {
        positions[i * 3 + 1] = 10;
        positions[i * 3] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
      }

      // Rotate petal in air
      rotations[i * 3] += 0.01;
      rotations[i * 3 + 1] += 0.015;

      dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      dummy.rotation.set(rotations[i * 3], rotations[i * 3 + 1], rotations[i * 3 + 2]);
      dummy.scale.set(scales[i * 3], scales[i * 3 + 1], scales[i * 3 + 2]);
      dummy.updateMatrix();

      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, count]}>
      <sphereGeometry args={[1, 7, 7]} />
      <meshStandardMaterial
        color="#FFB5D5"
        emissive="#FF70A6"
        emissiveIntensity={0.25}
        roughness={0.4}
        metalness={0.1}
        transparent
        opacity={0.88}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

export function GlowingPollen({ count = 100 }) {
  const pointsRef = useRef();

  const [positions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 18;
      pos[i + 1] = Math.random() * 8;
      pos[i + 2] = (Math.random() - 0.5) * 14;
    }
    return [pos];
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    const pos = pointsRef.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += Math.sin(time + i * 0.5) * 0.005;
      pos[i * 3] += Math.cos(time * 0.7 + i) * 0.003;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        color="#FFE66D"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
