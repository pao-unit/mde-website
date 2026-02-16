import { Box, Button, Grid, GridItem, Heading, Stack, Text } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { AnalysisSettingsPanel, DatasetSummaryPanel, SeriesPreviewPanel } from "../../../components/projects/index.ts";
import type { ColumnSummary } from "../../../components/projects/types.ts";
import { $api } from "../../../libs/api/index.ts";

const DEFAULT_D = 6;

export const Route = createFileRoute("/projects/$projectId/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	const navigate = Route.useNavigate();
	const { projectId } = Route.useParams();

	const {
		data: project,
		isPending: isProjectPending,
		isError: isProjectError,
	} = $api.useQuery(
		"get",
		"/api/projects/{project_id}",
		{
			params: { path: { project_id: projectId } },
		},
		{
			refetchInterval(query) {
				const response = query.state.data;
				return response?.result ? false : 10_000;
			},
		},
	);

	const {
		data: dataset,
		isPending: isDatasetPending,
		isError: isDatasetError,
	} = $api.useQuery("get", "/api/projects/{project_id}/dataset", {
		params: { path: { project_id: projectId } },
	});

	const columns: ColumnSummary[] = dataset?.columns ?? [];
	const columnNames = useMemo<string[]>(() => columns.map((column) => column.name), [columns]);

	const existingSettings = project?.settings;

	const [target, setTarget] = useState<string>(existingSettings?.target ?? "");
	const [removeColumns, setRemoveColumns] = useState<string[]>(existingSettings?.removeColumns ?? []);
	const [dimensions, setDimensions] = useState<number>(existingSettings?.D ?? DEFAULT_D);

	const defaultLibSize = dataset?.rowCount ? Math.round(dataset.rowCount * 0.8) : 1;
	const [libRange, setLibRange] = useState<[number, number]>(
		existingSettings ? [existingSettings.lib[0], existingSettings.lib[1]] : [1, defaultLibSize]
	);
	const [predRange, setPredRange] = useState<[number, number]>(
		existingSettings ? [existingSettings.pred[0], existingSettings.pred[1]] : [defaultLibSize + 1, dataset?.rowCount ?? 2],
	);
	const [selectedVariable, setSelectedVariable] = useState<string | null>(existingSettings?.target ?? null);

	useEffect(() => {
		if (columns.length === 0) return;

		setTarget((prev) => {
			if (prev && columnNames.includes(prev)) {
				return prev;
			}
			return existingSettings?.target ?? columnNames[0] ?? "";
		});

		setSelectedVariable((prev) => {
			if (prev && columnNames.includes(prev)) {
				return prev;
			}
			return existingSettings?.target ?? columnNames[0] ?? null;
		});

		setRemoveColumns((prev) => {
			const base = existingSettings ? existingSettings.removeColumns : prev;
			return base.filter((name) => columnNames.includes(name));
		});
	}, [columns, columnNames, existingSettings]);

	useEffect(() => {
		if (!existingSettings) return;
		setDimensions(existingSettings.D);
		setLibRange([existingSettings.lib[0], existingSettings.lib[1]]);
		setPredRange([existingSettings.pred[0], existingSettings.pred[1]]);
	}, [existingSettings]);

	const q = selectedVariable ? [selectedVariable] : [columnNames[0]];

	const {
		data: variables,
		isPending: isVariablesPending,
		isError: isVariablesError,
	} = $api.useQuery(
		"get",
		"/api/projects/{project_id}/variables",
		{
			params: {
				path: {
					project_id: projectId,
				},
				query: {
					variables: q,
				},
			},
		},
		{
			enabled: q.length > 0,
		},
	);

	const { mutateAsync: run, isPaused: isRunPending } = $api.useMutation("post", "/api/projects/{project_id}/settings", {
		onSuccess() {
			void navigate({ to: "/projects/$projectId", params: { projectId } });
		},
	});

	const onSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!target) {
			return;
		}

		void run({
			params: { path: { project_id: projectId } },
			body: {
				target,
				removeColumns,
				D: dimensions,
				lib: libRange,
				pred: predRange,
			},
		});
	};

	const handleTargetChange = (value: string) => {
		setTarget(value);
		setSelectedVariable(value);
		setRemoveColumns((current) => current.filter((name) => name !== value));
	};

	const handleIgnoreToggle = (name: string, checked: boolean) => {
		setRemoveColumns((current) => {
			if (checked) {
				if (current.includes(name) || name === target) {
					return current;
				}
				return [...current, name];
			}
			return current.filter((item) => item !== name);
		});
	};

	const datasetError = isDatasetError ? "Failed to load dataset summary." : undefined;
	const seriesError = isVariablesError ? `Unable to fetch series for ${q}. Try selecting another column.` : undefined;

	return (
		<form onSubmit={onSubmit}>
			<Stack gap={10}>
				<Stack gap={3}>
					<Heading size="lg">Configure analysis parameters</Heading>
					<Text color="fg.muted">
						Select the variables to include in the embedding, review summary statistics, and fine-tune the library and prediction
						ranges before launching the MDE run.
					</Text>
				</Stack>

				<Grid templateColumns={{ base: "1fr", xl: "320px 1fr" }} gap={8} alignItems="start">
					<GridItem>
						<DatasetSummaryPanel
							dataset={dataset}
							columns={columns}
							selectedVariable={selectedVariable}
							onSelectVariable={setSelectedVariable}
							isLoading={isDatasetPending}
							error={datasetError}
						/>
					</GridItem>

					<GridItem>
						<Stack gap={6}>
							<AnalysisSettingsPanel
								columnNames={columnNames}
								target={target}
								onTargetChange={handleTargetChange}
								dimensions={dimensions}
								onDimensionsChange={setDimensions}
								removeColumns={removeColumns}
								onToggleIgnore={handleIgnoreToggle}
								libRange={libRange}
								onLibraryRangeChange={(range) => setLibRange(range)}
								predRange={predRange}
								onPredictionRangeChange={(range) => setPredRange(range)}
							/>
							<SeriesPreviewPanel
								variable={selectedVariable}
								isLoading={isVariablesPending}
								error={seriesError}
								data={variables?.[selectedVariable ?? ""] ?? []}
							/>
						</Stack>
					</GridItem>
				</Grid>

				<Box display="flex" justifyContent="flex-end">
					<Button type="submit" colorPalette="blue" size="lg" loading={isRunPending}>
						Run analysis
					</Button>
				</Box>
			</Stack>
		</form>
	);
}
