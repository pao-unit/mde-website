import { Box, Breadcrumb, Center, Flex, ScrollArea } from "@chakra-ui/react";
import { createFileRoute, Outlet, Link as RouterLink } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$projectId")({
	component: ProjectLayout,
});

function ProjectLayout() {
	const { projectId } = Route.useParams();

	return (
		<Flex gap={6} direction="column" flex={1} minH={0}>
			<Center pt={8} flexShrink={0}>
				<Breadcrumb.Root w="full" maxW="6xl" px={4}>
					<Breadcrumb.List>
						<Breadcrumb.Item>
							<Breadcrumb.Link asChild>
								<RouterLink to="/">Home</RouterLink>
							</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Link asChild>
								{/* TODO: project list page */}
								<RouterLink to="/projects/$projectId" params={{ projectId }}>
									Projects
								</RouterLink>
							</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.CurrentLink asChild>
								<RouterLink to="/projects/$projectId" params={{ projectId }}>
									{projectId}
								</RouterLink>
							</Breadcrumb.CurrentLink>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</Center>
			<ScrollArea.Root flex={1} minH={0}>
				<ScrollArea.Viewport>
					<ScrollArea.Content>
						<Center>
							<Box maxW="6xl" px={4} py={8}>
								<Outlet />
							</Box>
						</Center>
					</ScrollArea.Content>
				</ScrollArea.Viewport>
				<ScrollArea.Scrollbar>
					<ScrollArea.Thumb />
				</ScrollArea.Scrollbar>
				<ScrollArea.Corner />
			</ScrollArea.Root>
		</Flex>
	);
}
