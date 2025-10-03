import { type ThreeElements, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import type * as THREE from "three";

export function Box3D(props: ThreeElements["mesh"]) {
	const meshRef = useRef<THREE.Mesh>(null);

	const [hovered, setHover] = useState(false);
	const [active, setActive] = useState(false);

	useFrame((_, delta) => {
		if (!meshRef.current) return;
		meshRef.current.rotation.x += delta;
	});

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: ignores
		<mesh
			{...props}
			ref={meshRef}
			scale={active ? 1.5 : 1}
			onClick={() => setActive(!active)}
			onPointerOver={() => setHover(true)}
			onPointerOut={() => setHover(false)}
		>
			<boxGeometry args={[1, 1, 1]} />
			<meshStandardMaterial color={hovered ? "hotpink" : "#2f74c0"} />
		</mesh>
	);
}
