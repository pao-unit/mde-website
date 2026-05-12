import { Badge, Button, Container, Stack, Table, Text } from "@chakra-ui/react";
import { createFileRoute, Link as RouterLink } from "@tanstack/react-router";
import { PageHeader, Panel } from "../components/ui/index.ts";
import { $api, getErrorMessage } from "../shared/api/client.ts";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	const projectsQuery = $api.useQuery("get", "/api/projects", undefined, { staleTime: 30_000 });
	const projects = projectsQuery.data ?? [];

	return (
		<Container maxW="6xl" py={{ base: 6, md: 10 }} px={{ base: 4, md: 6 }}>
			<Stack gap={6}>
				<PageHeader
					title="MDE projects"
					description="Upload datasets, configure edmkit Search runs, and inspect holdout prediction skill."
					actions={
						<Button asChild colorPalette="blue">
							<RouterLink to="/projects/new">New project</RouterLink>
						</Button>
					}
				/>

				<Panel title="Projects">
					{projectsQuery.isPending ? (
						<Text color="fg.muted">Loading projects...</Text>
					) : projectsQuery.isError ? (
						<Text color="red.700">{getErrorMessage(projectsQuery.error)}</Text>
					) : projects.length === 0 ? (
						<Stack gap={3}>
							<Text color="fg.muted">No projects have been created yet.</Text>
							<Button asChild colorPalette="blue" alignSelf="flex-start">
								<RouterLink to="/projects/new">Upload a dataset</RouterLink>
							</Button>
						</Stack>
					) : (
						<Table.ScrollArea borderWidth="1px" borderColor="gray.100" borderRadius="8px">
							<Table.Root size="sm" variant="line">
								<Table.Header>
									<Table.Row bg="gray.50">
										<Table.ColumnHeader>Project</Table.ColumnHeader>
										<Table.ColumnHeader>Source file</Table.ColumnHeader>
										<Table.ColumnHeader></Table.ColumnHeader>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{projects.map((project) => (
										<Table.Row key={project.id}>
											<Table.Cell>
												<Stack direction="row" gap={2} align="center" wrap="wrap">
													<Text fontWeight="medium">{project.id}</Text>
													<Badge colorPalette="gray">project</Badge>
												</Stack>
											</Table.Cell>
											<Table.Cell>{project.filename}</Table.Cell>
											<Table.Cell textAlign="end">
												<Button asChild variant="outline" size="sm">
													<RouterLink to="/projects/$projectId" params={{ projectId: project.id }}>
														Open
													</RouterLink>
												</Button>
											</Table.Cell>
										</Table.Row>
									))}
								</Table.Body>
							</Table.Root>
						</Table.ScrollArea>
					)}
				</Panel>
			</Stack>
		</Container>
	);
}
