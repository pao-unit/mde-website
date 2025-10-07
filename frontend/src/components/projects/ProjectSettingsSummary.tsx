import { Box, Button, DataList, Stack, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "@tanstack/react-router";
import type { ProjectSettings } from "./types.ts";

interface ProjectSettingsSummaryProps {
	projectId: string;
	filename: string;
	settings: ProjectSettings;
}

export function ProjectSettingsSummary({ projectId, filename, settings }: ProjectSettingsSummaryProps) {
	const ignoredColumns = settings.removeColumns.length > 0 ? settings.removeColumns.join(", ") : "None";

	return (
		<Box bg="white" borderRadius="xl" boxShadow="sm" p={6}>
			<Stack gap={4}>
				<Text fontSize="md" fontWeight="semibold">
						Settings
					</Text>
				<DataList.Root size="sm" colorPalette="gray">
					<DataList.Item>
						<DataList.ItemLabel>Target</DataList.ItemLabel>
						<DataList.ItemValue>{settings.target}</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item>
						<DataList.ItemLabel>Dimensions (D)</DataList.ItemLabel>
						<DataList.ItemValue>{settings.D}</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item>
						<DataList.ItemLabel>Library range</DataList.ItemLabel>
						<DataList.ItemValue>
							{settings.lib[0]} - {settings.lib[1]}
						</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item>
						<DataList.ItemLabel>Prediction range</DataList.ItemLabel>
						<DataList.ItemValue>
							{settings.pred[0]} - {settings.pred[1]}
						</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item>
						<DataList.ItemLabel>Ignored</DataList.ItemLabel>
						<DataList.ItemValue>{ignoredColumns}</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item>
						<DataList.ItemLabel>Source file</DataList.ItemLabel>
						<DataList.ItemValue>{filename}</DataList.ItemValue>
					</DataList.Item>
				</DataList.Root>
				<Button asChild variant="outline" colorPalette="blue">
					<RouterLink to="/projects/$projectId/settings" params={{ projectId }}>
						Change settings
					</RouterLink>
				</Button>
			</Stack>
		</Box>
	);
}
