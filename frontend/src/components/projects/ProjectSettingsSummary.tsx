import { Box, Button, DataList, Stack, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "@tanstack/react-router";
import type { ProjectSettings } from "./types.ts";

interface ProjectSettingsSummaryProps {
	projectId: string;
	filename: string;
	settings: ProjectSettings;
}

export function ProjectSettingsSummary({ projectId, filename, settings }: ProjectSettingsSummaryProps) {
	const excluded = settings.excludeColumns ?? [];
	const excludedColumns = excluded.length > 0 ? excluded.join(", ") : "None";

	return (
		<Box bg="white" borderRadius="xl" boxShadow="sm" p={6}>
			<Stack gap={4}>
				<Text fontSize="md" fontWeight="semibold">
					Settings
				</Text>
				<DataList.Root size="sm" colorPalette="gray">
					<DataList.Item>
						<DataList.ItemLabel>Backend</DataList.ItemLabel>
						<DataList.ItemValue>{settings.backend === "dimx" ? "dimx" : "edmkit"}</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item>
						<DataList.ItemLabel>Targets</DataList.ItemLabel>
						<DataList.ItemValue>{settings.targets.join(", ")}</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item>
						<DataList.ItemLabel>Max variables</DataList.ItemLabel>
						<DataList.ItemValue>{settings.maxVariables}</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item>
						<DataList.ItemLabel>Training (library)</DataList.ItemLabel>
						<DataList.ItemValue>
							{settings.libraryRange.start} – {settings.libraryRange.end}
						</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item>
						<DataList.ItemLabel>Training (prediction)</DataList.ItemLabel>
						<DataList.ItemValue>
							{settings.predictionRange.start} – {settings.predictionRange.end}
						</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item>
						<DataList.ItemLabel>Holdout</DataList.ItemLabel>
						<DataList.ItemValue>
							{settings.holdoutRange.start} – {settings.holdoutRange.end}
						</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item>
						<DataList.ItemLabel>Excluded</DataList.ItemLabel>
						<DataList.ItemValue>{excludedColumns}</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item>
						<DataList.ItemLabel>Seed</DataList.ItemLabel>
						<DataList.ItemValue>{settings.seed}</DataList.ItemValue>
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
