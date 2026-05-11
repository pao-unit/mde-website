import { Box } from "@chakra-ui/react";
import type { ReactNode } from "react";

export interface ChartScrollAreaProps {
	children: ReactNode;
	minWidth?: number | string;
	ariaLabel?: string;
}

export function ChartScrollArea({ children, minWidth = 640, ariaLabel }: ChartScrollAreaProps) {
	return (
		<Box
			aria-label={ariaLabel}
			borderWidth="1px"
			borderColor="gray.100"
			borderRadius="8px"
			maxW="full"
			overflowX="auto"
			overflowY="hidden"
			role={ariaLabel ? "region" : undefined}
		>
			<Box minW={minWidth} w="max-content" color="fg" p={2}>
				{children}
			</Box>
		</Box>
	);
}
