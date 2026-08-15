import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Text } from '@react-three/drei';
import * as THREE from 'three';

export function FlowerModel({ type = 'rose', position = [0, 0, 0], scale = 1, onSelect, label = '' }) {
  const group = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!group.current) return;
    const time = state.clock.getElapsedTime();
    // Gentle floating and subtle rotation
    group.current.rotation.y = time * 0.3 + (position[0] * 0.2);
    if (hovered) {
      group.current.scale.lerp(new THREE.Vector3(scale * 1.25, scale * 1.25, scale * 1.25), 0.1);
    } else {
      group.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }
  });

  const renderFlowerGeometry = () => {
    switch (type) {
      case 'rose':
        return (
          <group>
            {/* Center core */}
            <mesh position={[0, 0.4, 0]}>
              <sphereGeometry args={[0.22, 16, 16]} />
              <meshStandardMaterial color="#C9184A" roughness={0.3} metalness={0.1} />
            </mesh>
            {/* Petal layers spiral */}
            {[...Array(12)].map((_, i) => {
              const angle = (i * Math.PI) / 3;
              const radius = 0.25 + (i * 0.035);
              const y = 0.35 - (i * 0.02);
              return (
                <mesh
                  key={i}
                  position={[Math.cos(angle) * radius, y, Math.sin(angle) * radius]}
                  rotation={[0.3 + (i * 0.05), angle, 0.2]}
                >
                  <sphereGeometry args={[0.32, 12, 12]} />
                  <meshStandardMaterial
                    color={i % 2 === 0 ? "#FF4D6D" : "#FF758F"}
                    roughness={0.35}
                    emissive="#590D22"
                    emissiveIntensity={0.15}
                  />
                </mesh>
              );
            })}
            {/* Calyx & Stem */}
            <mesh position={[0, -0.6, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 1.4, 8]} />
              <meshStandardMaterial color="#40916C" roughness={0.7} />
            </mesh>
          </group>
        );

      case 'sunflower':
        return (
          <group>
            {/* Dark Center Seed Disk */}
            <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 4, 0, 0]}>
              <cylinderGeometry args={[0.42, 0.42, 0.12, 24]} />
              <meshStandardMaterial color="#4E342E" roughness={0.9} />
            </mesh>
            {/* Golden Petals Ring */}
            {[...Array(18)].map((_, i) => {
              const angle = (i * 2 * Math.PI) / 18;
              const r = 0.65;
              return (
                <mesh
                  key={i}
                  position={[Math.cos(angle) * r, 0.3 + Math.sin(angle) * 0.15, Math.sin(angle) * r]}
                  rotation={[0.4, 0, angle]}
                >
                  <coneGeometry args={[0.12, 0.55, 8]} />
                  <meshStandardMaterial
                    color={i % 2 === 0 ? "#FFD43B" : "#FAB005"}
                    roughness={0.3}
                    emissive="#E67700"
                    emissiveIntensity={0.2}
                  />
                </mesh>
              );
            })}
            {/* Stem */}
            <mesh position={[0, -0.6, -0.2]}>
              <cylinderGeometry args={[0.06, 0.06, 1.4, 8]} />
              <meshStandardMaterial color="#2D6A4F" roughness={0.7} />
            </mesh>
          </group>
        );

      case 'hydrangea':
        return (
          <group>
            {/* Spherical cluster of mini petals */}
            {[...Array(24)].map((_, i) => {
              const phi = Math.acos(-1 + (2 * i) / 24);
              const theta = Math.sqrt(24 * Math.PI) * phi;
              const r = 0.55;
              const x = r * Math.cos(theta) * Math.sin(phi);
              const y = 0.3 + r * Math.sin(theta) * Math.sin(phi);
              const z = r * Math.cos(phi);
              const colors = ["#74C0FC", "#A5D8FF", "#B197FC", "#D0BFFF"];
              return (
                <mesh key={i} position={[x, y, z]}>
                  <boxGeometry args={[0.18, 0.18, 0.08]} />
                  <meshStandardMaterial
                    color={colors[i % colors.length]}
                    roughness={0.4}
                    emissive="#4DABF7"
                    emissiveIntensity={0.15}
                  />
                </mesh>
              );
            })}
            {/* Stem */}
            <mesh position={[0, -0.5, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 1.2, 8]} />
              <meshStandardMaterial color="#52B788" roughness={0.7} />
            </mesh>
          </group>
        );

      case 'chrysanthemum':
        return (
          <group>
            {/* Yellow Center */}
            <mesh position={[0, 0.35, 0]}>
              <sphereGeometry args={[0.22, 16, 16]} />
              <meshStandardMaterial color="#FFA94D" roughness={0.6} />
            </mesh>
            {/* Multi-layered dense petals */}
            {[...Array(20)].map((_, i) => {
              const angle = (i * 2 * Math.PI) / 20;
              const radius = 0.5;
              return (
                <mesh
                  key={i}
                  position={[Math.cos(angle) * radius, 0.32, Math.sin(angle) * radius]}
                  rotation={[0.2, angle, 0.1]}
                >
                  <capsuleGeometry args={[0.07, 0.38, 4, 8]} />
                  <meshStandardMaterial
                    color={i % 3 === 0 ? "#FFE066" : "#FFF3BF"}
                    roughness={0.3}
                    emissive="#F59F00"
                    emissiveIntensity={0.18}
                  />
                </mesh>
              );
            })}
            {/* Stem */}
            <mesh position={[0, -0.5, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
              <meshStandardMaterial color="#40916C" roughness={0.7} />
            </mesh>
          </group>
        );

      case 'lavender':
        return (
          <group>
            {/* Vertical tiered floral spikes */}
            {[...Array(7)].map((_, tier) => {
              const y = 0.0 + tier * 0.16;
              return (
                <group key={tier} position={[0, y, 0]}>
                  {[...Array(5)].map((_, j) => {
                    const angle = (j * 2 * Math.PI) / 5 + tier * 0.4;
                    const r = 0.18 - tier * 0.015;
                    return (
                      <mesh
                        key={j}
                        position={[Math.cos(angle) * r, 0, Math.sin(angle) * r]}
                        rotation={[0.3, angle, 0]}
                      >
                        <capsuleGeometry args={[0.06, 0.14, 4, 8]} />
                        <meshStandardMaterial
                          color={tier % 2 === 0 ? "#9775FA" : "#7950F2"}
                          roughness={0.4}
                          emissive="#5F3DC4"
                          emissiveIntensity={0.2}
                        />
                      </mesh>
                    );
                  })}
                </group>
              );
            })}
            {/* Slender stem */}
            <mesh position={[0, -0.6, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 1.4, 8]} />
              <meshStandardMaterial color="#52B788" roughness={0.7} />
            </mesh>
          </group>
        );

      default:
        return (
          <mesh position={[0, 0.3, 0]}>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial color="#FF6B6B" />
          </mesh>
        );
    }
  };

  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
      <group
        ref={group}
        position={position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onSelect && onSelect(type)}
        cursor="pointer"
      >
        {renderFlowerGeometry()}
        {label && (
          <Text
            position={[0, -1.3, 0]}
            fontSize={0.24}
            color={hovered ? "#FFF3B0" : "#FFFFFF"}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#2C3E50"
          >
            {label}
          </Text>
        )}
      </group>
    </Float>
  );
}
