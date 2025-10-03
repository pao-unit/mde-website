import { Canvas } from "@react-three/fiber";
import type { PropsWithChildren } from "react";

export default function Scene(props: PropsWithChildren) {
	return (
		<Canvas>
			<ambientLight intensity={Math.PI / 2} />
			<spotLight
				position={[10, 10, 10]}
				angle={0.15}
				penumbra={1}
				decay={0}
				intensity={Math.PI}
			/>
			<pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
			{props.children}
		</Canvas>
	);
}
