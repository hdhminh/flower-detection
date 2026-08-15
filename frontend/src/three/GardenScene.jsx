import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { FlowerModel } from './FlowerModel';
import { FloatingPetals, GlowingPollen } from './Particles';
import { useLang } from '../lang';

const FLOWERS_CONFIG = [
  { id: 'chrysanthemum', label_vi: 'Hoa cúc 🌼', label_en: 'Chrysanthemum 🌼', pos: [-4.2, 0, -0.8] },
  { id: 'rose', label_vi: 'Hoa hồng 🌹', label_en: 'Rose 🌹', pos: [-2.1, 0.2, 0.4] },
  { id: 'hydrangea', label_vi: 'Cẩm tú cầu 🌸', label_en: 'Hydrangea 🌸', pos: [0, 0.4, 0.8] },
  { id: 'lavender', label_vi: 'Oải hương 💜', label_en: 'Lavender 💜', pos: [2.1, 0.2, 0.4] },
  { id: 'sunflower', label_vi: 'Hướng dương 🌻', label_en: 'Sunflower 🌻', pos: [4.2, 0, -0.8] }
];

export function GardenScene({ onSelectFlower }) {
  const { lang } = useLang();

  return (
    <div className="garden-3d-wrapper">
      <Canvas
        shadows
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <PerspectiveCamera makeDefault position={[0, 1.2, 6.5]} fov={50} />

        {/* Ambient & Directional Garden Lights */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[6, 8, 5]} intensity={1.2} castShadow />
        <directionalLight position={[-6, 4, -3]} intensity={0.4} color="#B3D9FF" />
        <pointLight position={[0, 2, 2]} intensity={0.8} color="#FFF3B0" />

        <Suspense fallback={null}>
          {/* Floating Petals & Glowing Pollen Particles */}
          <FloatingPetals count={160} />
          <GlowingPollen count={90} />

          {/* 5 Interactive 3D Flowers */}
          {FLOWERS_CONFIG.map((flower) => (
            <FlowerModel
              key={flower.id}
              type={flower.id}
              position={flower.pos}
              scale={1.1}
              label={lang === 'en' ? flower.label_en : flower.label_vi}
              onSelect={() => onSelectFlower && onSelectFlower(flower.id)}
            />
          ))}

          {/* Ground Plane with Grass Tint */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0]} receiveShadow>
            <circleGeometry args={[14, 48]} />
            <meshStandardMaterial
              color="#A8D5BA"
              roughness={0.85}
              metalness={0.05}
              transparent
              opacity={0.35}
            />
          </mesh>
        </Suspense>

        {/* Smooth OrbitControls with constraints */}
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minPolarAngle={Math.PI / 3.5}
          maxAzimuthAngle={Math.PI / 4}
          minAzimuthAngle={-Math.PI / 4}
          rotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
