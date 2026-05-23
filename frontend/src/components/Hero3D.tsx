"use client";
import { Canvas } from "@react-three/fiber";
import { Float, Environment } from "@react-three/drei";

export default function Hero3D() {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 45 }} style={{ position: "absolute", inset: 0, zIndex: 0 }}>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.6} color="#E8A87C" />
      <pointLight position={[-5, -5, -5]} intensity={0.3} color="#B8A4D4" />
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.6}>
        <mesh rotation={[0.3, 0.5, 0]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#E8A87C" metalness={0.4} roughness={0.3} wireframe />
        </mesh>
        <mesh rotation={[0.3, 0.5, 0]} scale={0.5} position={[1.5, 0, 0]}>
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshStandardMaterial color="#B8A4D4" metalness={0.6} roughness={0.2} />
        </mesh>
        <mesh rotation={[0.3, 0.5, 0]} scale={0.3} position={[-1.2, 1, 0]}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#9DBFAF" metalness={0.5} roughness={0.3} />
        </mesh>
      </Float>
      <Environment preset="city" />
    </Canvas>
  );
}
