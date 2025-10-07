import { Button, EmptyState } from "@chakra-ui/react";
import { Link as RouterLink } from "@tanstack/react-router";
import MaterialSymbolsIndeterminateQuestionBox from "~icons/material-symbols/indeterminate-question-box";

interface ProjectEmptyStateProps {
	projectId: string;
	filename: string;
}

export function ProjectEmptyState({ projectId, filename }: ProjectEmptyStateProps) {
	return (
		<EmptyState.Root size="lg">
			<EmptyState.Content w="full">
				<EmptyState.Indicator>
					<MaterialSymbolsIndeterminateQuestionBox />
				</EmptyState.Indicator>
				<EmptyState.Title>Prepare your project</EmptyState.Title>
				<EmptyState.Description color="fg.muted">{filename} has been uploaded.</EmptyState.Description>
				<Button asChild colorPalette="blue" size="lg">
					<RouterLink to="/projects/$projectId/settings" params={{ projectId }}>
						Configure settings
					</RouterLink>
				</Button>
			</EmptyState.Content>
		</EmptyState.Root>
	);
}
