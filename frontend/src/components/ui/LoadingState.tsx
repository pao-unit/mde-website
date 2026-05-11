import { Skeleton, Spinner, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

export interface LoadingStateProps {
	title?: ReactNode;
	description?: ReactNode;
	showSkeleton?: boolean;
}

export function LoadingState({ title = "Loading", description, showSkeleton = false }: LoadingStateProps) {
	return (
		<Stack gap={4} color="fg.muted">
			<Stack direction="row" gap={3} align="center">
				<Spinner size="sm" />
				<Text fontWeight="medium">{title}</Text>
			</Stack>
			{description ? <Text>{description}</Text> : null}
			{showSkeleton ? (
				<Stack gap={3}>
					<Skeleton height="24px" borderRadius="8px" />
					<Skeleton height="120px" borderRadius="8px" />
					<Skeleton height="220px" borderRadius="8px" />
				</Stack>
			) : null}
		</Stack>
	);
}
