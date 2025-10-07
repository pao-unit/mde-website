import { Button, Spinner, Stack, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "@tanstack/react-router";

interface ProjectInProgressStateProps {
	projectId: string;
}

export function ProjectInProgressState({ projectId }: ProjectInProgressStateProps) {
	return (
		<Stack gap={8}>
			<Stack gap={3}>
				<Text as="h2" fontSize="2xl" fontWeight="semibold">
					Analysis in progress
				</Text>
				<Text color="fg.muted">
					We are executing the MDE workflow with your settings. This can take a few minutes depending on dataset size.
				</Text>
			</Stack>
			<Stack direction="row" align="center" gap={3} color="fg.muted">
				<Spinner size="sm" />
				<Text>Waiting for results…</Text>
			</Stack>
			<Button asChild variant="outline" alignSelf="flex-start">
				<RouterLink to="/projects/$projectId/settings" params={{ projectId }}>
					Settings
				</RouterLink>
			</Button>
		</Stack>
	);
}
