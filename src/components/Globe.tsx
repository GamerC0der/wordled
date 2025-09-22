'use client';

import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import 'flag-icons/css/flag-icons.min.css';

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
  { name: 'AUSTRALIA', color: '#FF8C00', lat: -25, lng: 135, flagClass: 'fi fi-au', isSmall: false },
  { name: 'BRAZIL', color: '#4CAF50', lat: -15, lng: -55, flagClass: 'fi fi-br', isSmall: false },
  { name: 'CANADA', color: '#2196F3', lat: 60, lng: -100, flagClass: 'fi fi-ca', isSmall: false },
  { name: 'CHINA', color: '#FF9800', lat: 35, lng: 105, flagClass: 'fi fi-cn', isSmall: false },
  { name: 'FRANCE', color: '#9C27B0', lat: 46, lng: 2, flagClass: 'fi fi-fr', isSmall: false },
  { name: 'GERMANY', color: '#F44336', lat: 51, lng: 10, flagClass: 'fi fi-de', isSmall: false },
  { name: 'INDIA', color: '#FF5722', lat: 20, lng: 78, flagClass: 'fi fi-in', isSmall: false },
  { name: 'ITALY', color: '#00BCD4', lat: 41, lng: 12, flagClass: 'fi fi-it', isSmall: false },
  { name: 'JAPAN', color: '#607D8B', lat: 36, lng: 138, flagClass: 'fi fi-jp', isSmall: false },
  { name: 'MEXICO', color: '#8BC34A', lat: 23, lng: -102, flagClass: 'fi fi-mx', isSmall: false },
  { name: 'POLAND', color: '#CDDC39', lat: 52, lng: 19, flagClass: 'fi fi-pl', isSmall: false },
  { name: 'RUSSIA', color: '#795548', lat: 60, lng: 100, flagClass: 'fi fi-ru', isSmall: false },
  { name: 'SPAIN', color: '#FFC107', lat: 40, lng: -4, flagClass: 'fi fi-es', isSmall: false },
  { name: 'SWEDEN', color: '#3F51B5', lat: 60, lng: 15, flagClass: 'fi fi-se', isSmall: false },
  { name: 'TURKEY', color: '#009688', lat: 39, lng: 35, flagClass: 'fi fi-tr', isSmall: false },
  { name: 'UKRAINE', color: '#E91E63', lat: 49, lng: 32, flagClass: 'fi fi-ua', isSmall: false },
  { name: 'USA', color: '#FF6B35', lat: 40, lng: -100, flagClass: 'fi fi-us', isSmall: false },
  { name: 'SOUTH KOREA', color: '#FFC107', lat: 36, lng: 128, flagClass: 'fi fi-kr', isSmall: false },
  { name: 'SOUTH AFRICA', color: '#4CAF50', lat: -30, lng: 25, flagClass: 'fi fi-za', isSmall: false },
  { name: 'ARGENTINA', color: '#2196F3', lat: -34, lng: -64, flagClass: 'fi fi-ar', isSmall: false },
  { name: 'MONACO', color: '#E91E63', lat: 43.7, lng: 7.4, flagClass: 'fi fi-mc', isSmall: true },
  { name: 'SAN MARINO', color: '#9C27B0', lat: 43.9, lng: 12.4, flagClass: 'fi fi-sm', isSmall: true },
  { name: 'LIECHTENSTEIN', color: '#3F51B5', lat: 47.1, lng: 9.5, flagClass: 'fi fi-li', isSmall: true },
  { name: 'ANDORRA', color: '#00BCD4', lat: 42.5, lng: 1.5, flagClass: 'fi fi-ad', isSmall: true },
  { name: 'LUXEMBOURG', color: '#607D8B', lat: 49.6, lng: 6.1, flagClass: 'fi fi-lu', isSmall: true },
  { name: 'MALTA', color: '#FFC107', lat: 35.9, lng: 14.5, flagClass: 'fi fi-mt', isSmall: true },
  { name: 'ICELAND', color: '#2196F3', lat: 64.9, lng: -19.0, flagClass: 'fi fi-is', isSmall: true },
  { name: 'VATICAN CITY', color: '#4CAF50', lat: 41.9, lng: 12.4, flagClass: 'fi fi-va', isSmall: true },
  { name: 'NAURU', color: '#FF9800', lat: -0.5, lng: 166.9, flagClass: 'fi fi-nr', isSmall: true },
  { name: 'TUVALU', color: '#9C27B0', lat: -8.5, lng: 179.2, flagClass: 'fi fi-tv', isSmall: true },
  { name: 'PALAU', color: '#00BCD4', lat: 7.5, lng: 134.6, flagClass: 'fi fi-pw', isSmall: true },
  { name: 'MARSHALL ISLANDS', color: '#8BC34A', lat: 7.1, lng: 171.2, flagClass: 'fi fi-mh', isSmall: true },
  { name: 'KIRIBATI', color: '#CDDC39', lat: -3.4, lng: -168.7, flagClass: 'fi fi-ki', isSmall: true },
  { name: 'MICRONESIA', color: '#795548', lat: 6.9, lng: 158.2, flagClass: 'fi fi-fm', isSmall: true },
  { name: 'SEYCHELLES', color: '#FFC107', lat: -4.6, lng: 55.5, flagClass: 'fi fi-sc', isSmall: true },
  { name: 'ANTIGUA AND BARBUDA', color: '#3F51B5', lat: 17.1, lng: -61.8, flagClass: 'fi fi-ag', isSmall: true },
  { name: 'BARBADOS', color: '#607D8B', lat: 13.2, lng: -59.5, flagClass: 'fi fi-bb', isSmall: true }
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

  useFrame(() => {
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
                fontSize: country.isSmall ? '9px' : '18px',
                userSelect: 'none',
                zIndex: 10
              }}
            >
              <div
                onClick={() => onCountrySelect(country.name)}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                {isHovered && (
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {country.name}
                  </div>
                )}
                <div className={country.flagClass} />
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
