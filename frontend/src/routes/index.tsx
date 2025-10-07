import { Button, Container, Stack } from "@chakra-ui/react";
import { createFileRoute, Link as RouterLink } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	return (
		<Container maxW="6xl" py={8}>
			<Stack>
				<Button asChild colorPalette="blue" size="lg" alignSelf="flex-start">
					<RouterLink to="/projects/new">Create a new project</RouterLink>
				</Button>
			</Stack>
		</Container>
	);
}
