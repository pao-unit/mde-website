import { Button, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

export interface ErrorStateProps {
	title?: ReactNode;
	description?: ReactNode;
	actionLabel?: string;
	onRetry?: () => void;
}

export function ErrorState({ title = "Unable to load this view", description, actionLabel = "Retry", onRetry }: ErrorStateProps) {
	return (
		<Stack gap={4} bg="red.50" borderWidth="1px" borderColor="red.200" borderRadius="8px" p={{ base: 4, md: 6 }}>
			<Stack gap={1}>
				<Text fontWeight="semibold" color="red.800">
					{title}
				</Text>
				{description ? <Text color="red.700">{description}</Text> : null}
			</Stack>
			{onRetry ? (
				<Button variant="outline" colorPalette="red" alignSelf="flex-start" onClick={onRetry}>
					{actionLabel}
				</Button>
			) : null}
		</Stack>
	);
}
