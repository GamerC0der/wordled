'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

interface GlobeProps {
  targetCountry: string;
  guessedCountries: string[];
  onCountrySelect: (country: string) => void;
}

const vibrantColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
];

const countries = [
  { name: 'BRAZIL', color: '#4CAF50', lat: -15, lng: -55 },
  { name: 'CANADA', color: '#2196F3', lat: 60, lng: -100 },
  { name: 'CHINA', color: '#FF9800', lat: 35, lng: 105 },
  { name: 'FRANCE', color: '#9C27B0', lat: 46, lng: 2 },
  { name: 'GERMANY', color: '#F44336', lat: 51, lng: 10 },
  { name: 'INDIA', color: '#FF5722', lat: 20, lng: 78 },
  { name: 'ITALY', color: '#00BCD4', lat: 41, lng: 12 },
  { name: 'JAPAN', color: '#607D8B', lat: 36, lng: 138 },
  { name: 'MEXICO', color: '#8BC34A', lat: 23, lng: -102 },
  { name: 'POLAND', color: '#CDDC39', lat: 52, lng: 19 },
  { name: 'RUSSIA', color: '#795548', lat: 60, lng: 100 },
  { name: 'SPAIN', color: '#FFC107', lat: 40, lng: -4 },
  { name: 'SWEDEN', color: '#3F51B5', lat: 60, lng: 15 },
  { name: 'TURKEY', color: '#009688', lat: 39, lng: 35 },
  { name: 'UKRAINE', color: '#E91E63', lat: 49, lng: 32 },
  { name: 'USA', color: '#FF6B35', lat: 40, lng: -100 }
];

function Hexagon({ position, color, onClick, onHover, onHoverOut, isHovered }: {
  position: [number, number, number],
  color: string,
  onClick: () => void,
  onHover: () => void,
  onHoverOut: () => void,
  isHovered: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isVisible, setIsVisible] = useState(true);

  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 6);
    return geo;
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.lookAt(state.camera.position);

      const cameraDirection = new THREE.Vector3();
      state.camera.getWorldDirection(cameraDirection);
      const hexagonPosition = new THREE.Vector3(...position);
      const toHexagon = hexagonPosition.sub(state.camera.position).normalize();

      const dotProduct = cameraDirection.dot(toHexagon);
      setIsVisible(dotProduct > -0.3);
    }
  });

  if (!isVisible) return null;

  return (
    <mesh
      ref={meshRef}
      position={position}
      geometry={geometry}
      onClick={onClick}
      onPointerOver={onHover}
      onPointerOut={onHoverOut}
    >
      <meshStandardMaterial
        color={color}
        emissive={isHovered ? color : '#111111'}
        emissiveIntensity={isHovered ? 0.5 : 0.1}
        metalness={0.2}
        roughness={0.3}
      />
    </mesh>
  );
}

function GlobeScene({ targetCountry, guessedCountries, onCountrySelect }: GlobeProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const earthGeometry = useMemo(() => new THREE.SphereGeometry(100, 64, 64), []);
  const earthTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return loader.load('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
  }, []);

  const hexPositions = useMemo(() => {
    return countries.map(country => {
      const phi = (90 - country.lat) * (Math.PI / 180);
      const theta = (country.lng + 180) * (Math.PI / 180);

      const x = -(101.2 * Math.sin(phi) * Math.cos(theta));
      const z = 101.2 * Math.sin(phi) * Math.sin(theta);
      const y = 101.2 * Math.cos(phi);

      return [x, y, z] as [number, number, number];
    });
  }, []);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 3, 5]} intensity={1.5} />
      <directionalLight position={[-5, -3, -5]} intensity={0.8} />
      <pointLight position={[0, 0, 0]} intensity={0.3} />

      <mesh geometry={earthGeometry}>
        <meshStandardMaterial map={earthTexture} />
      </mesh>

      {countries.map((country, index) => {
        const isTarget = country.name === targetCountry;
        const isGuessed = guessedCountries.includes(country.name);
        const isHovered = hovered === country.name;

        const color = isTarget ? '#FFD700' :
                     isGuessed ? '#FF6B6B' :
                     isHovered ? '#4ECDC4' :
                     vibrantColors[index % vibrantColors.length];

        const textPosition: [number, number, number] = [
          hexPositions[index][0],
          hexPositions[index][1] + 1.5,
          hexPositions[index][2]
        ];

        return (
          <group key={country.name}>
            <Hexagon
              position={hexPositions[index]}
              color={color}
              onClick={() => onCountrySelect(country.name)}
              onHover={() => setHovered(country.name)}
              onHoverOut={() => setHovered(null)}
              isHovered={isHovered}
            />
            <Html
              position={textPosition}
              center
              style={{
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px black',
                pointerEvents: 'none',
                userSelect: 'none'
              }}
            >
              {country.name}
            </Html>
          </group>
        );
      })}
    </>
  );
}

export default function Globe({ targetCountry, guessedCountries, onCountrySelect }: GlobeProps) {
  return (
    <div className="w-full h-96 bg-black rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 0, 400], fov: 45 }}>
        <GlobeScene
          targetCountry={targetCountry}
          guessedCountries={guessedCountries}
          onCountrySelect={onCountrySelect}
        />
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          minDistance={200}
          maxDistance={600}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
