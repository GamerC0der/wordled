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
  { name: 'AUSTRALIA', color: '#FF8C00', lat: -25, lng: 135, flag: '🇦🇺' },
  { name: 'BRAZIL', color: '#4CAF50', lat: -15, lng: -55, flag: '🇧🇷' },
  { name: 'CANADA', color: '#2196F3', lat: 60, lng: -100, flag: '🇨🇦' },
  { name: 'CHINA', color: '#FF9800', lat: 35, lng: 105, flag: '🇨🇳' },
  { name: 'FRANCE', color: '#9C27B0', lat: 46, lng: 2, flag: '🇫🇷' },
  { name: 'GERMANY', color: '#F44336', lat: 51, lng: 10, flag: '🇩🇪' },
  { name: 'INDIA', color: '#FF5722', lat: 20, lng: 78, flag: '🇮🇳' },
  { name: 'ITALY', color: '#00BCD4', lat: 41, lng: 12, flag: '🇮🇹' },
  { name: 'JAPAN', color: '#607D8B', lat: 36, lng: 138, flag: '🇯🇵' },
  { name: 'MEXICO', color: '#8BC34A', lat: 23, lng: -102, flag: '🇲🇽' },
  { name: 'POLAND', color: '#CDDC39', lat: 52, lng: 19, flag: '🇵🇱' },
  { name: 'RUSSIA', color: '#795548', lat: 60, lng: 100, flag: '🇷🇺' },
  { name: 'SPAIN', color: '#FFC107', lat: 40, lng: -4, flag: '🇪🇸' },
  { name: 'SWEDEN', color: '#3F51B5', lat: 60, lng: 15, flag: '🇸🇪' },
  { name: 'TURKEY', color: '#009688', lat: 39, lng: 35, flag: '🇹🇷' },
  { name: 'UKRAINE', color: '#E91E63', lat: 49, lng: 32, flag: '🇺🇦' },
  { name: 'USA', color: '#FF6B35', lat: 40, lng: -100, flag: '🇺🇸' }
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

  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 6);
    return geo;
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.lookAt(state.camera.position);
    }
  });

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
  const [visibleCountries, setVisibleCountries] = useState<boolean[]>(() => countries.map(() => true));
  const { camera } = useThree();

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

  useFrame((state) => {
    const { viewport } = state;
    const newVisibility = countries.map((country, index) => {
      const hexagonPosition = new THREE.Vector3(...hexPositions[index]);

      const cameraPosNormalized = camera.position.clone().normalize();
      const hexagonPosNormalized = hexagonPosition.clone().normalize();
      const dotProduct = cameraPosNormalized.dot(hexagonPosNormalized);

      const isVisibleFromGlobe = dotProduct > 0;

      const screenPos = hexagonPosition.clone();
      screenPos.project(camera);

      const edgeThreshold = 0.1;
      const isOnEdge = Math.abs(screenPos.x) > (1 - edgeThreshold) ||
                      Math.abs(screenPos.y) > (1 - edgeThreshold);

      return isVisibleFromGlobe && !isOnEdge;
    });
    setVisibleCountries(newVisibility);
  });

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

        if (!visibleCountries[index]) return null;

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
              zIndexRange={[10, 20]}
              style={{
                color: 'white',
                fontSize: '24px',
                userSelect: 'none',
                zIndex: 10
              }}
            >
              <div
                onClick={() => onCountrySelect(country.name)}
                style={{ cursor: 'pointer' }}
              >
                {country.flag}
              </div>
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
