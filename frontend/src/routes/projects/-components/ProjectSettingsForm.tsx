import { Flex, Grid, Stack, Text } from "@chakra-ui/react";
import { useStore } from "@tanstack/react-form";
import type { ReactNode } from "react";
import LinePlot from "../../../components/LinePlot.tsx";
import { ChartScrollArea } from "../../../components/ui/ChartScrollArea.tsx";
import { ErrorState } from "../../../components/ui/ErrorState.tsx";
import { LoadingState } from "../../../components/ui/LoadingState.tsx";
import { Panel } from "../../../components/ui/Panel.tsx";
import { SETTINGS_FORM_DEFAULT_VALUES } from "../-forms/settingsSchema.ts";
import { withForm } from "../-forms/projectForm.tsx";
import type { FoldRanges } from "../-utils/foldRanges.ts";
import type { AnalysisBackend, ColumnSummary } from "../-utils/model.ts";
import {
	assignVariableRole,
	setBackend,
	validateSettings,
	type SettingsValidationIssue,
	type VariableRole,
} from "../-utils/settings.ts";
import { FoldRangeSlider } from "./FoldRangeSlider.tsx";
import { VariableRoleTable } from "./VariableRoleTable.tsx";

interface ProjectSettingsFormFieldsProps {
	columns: ColumnSummary[];
	columnNames: string[];
	selectedVariable?: string | null;
	onSelectVariable?: (column: string) => void;
	previewData?: number[] | null;
	isPreviewLoading?: boolean;
	previewError?: string | null;
	isDatasetLoading?: boolean;
	datasetError?: string | null;
	totalPoints: number;
	runError?: ReactNode;
	submitLabel?: string;
}

const defaultProjectSettingsFormFieldsProps: ProjectSettingsFormFieldsProps = {
	columns: [],
	columnNames: [],
	selectedVariable: null,
	onSelectVariable: undefined,
	previewData: null,
	isPreviewLoading: false,
	previewError: null,
	isDatasetLoading: false,
	datasetError: null,
	totalPoints: 0,
	runError: null,
	submitLabel: "Run analysis",
};

export const ProjectSettingsFormFields = withForm({
	defaultValues: SETTINGS_FORM_DEFAULT_VALUES,
	props: defaultProjectSettingsFormFieldsProps,
	render: function Render({
		form,
		columns,
		columnNames,
		selectedVariable,
		onSelectVariable,
		previewData,
		isPreviewLoading = false,
		previewError,
		isDatasetLoading = false,
		datasetError,
		totalPoints,
		runError,
		submitLabel = "Run analysis",
	}) {
		const settings = useStore(form.store, (state) => state.values);
		const ranges = useStore(
			form.store,
			(state): FoldRanges => ({
				libraryRange: state.values.libraryRange,
				predictionRange: state.values.predictionRange,
				holdoutRange: state.values.holdoutRange,
			}),
		);
		const validationIssues = validateSettings(settings, { columnNames, totalPoints });

		const updateRole = (column: string, role: VariableRole) => {
			const next = assignVariableRole(settings, column, role, { columnNames });
			form.setFieldValue("targets", next.targets);
			form.setFieldValue("excludeColumns", next.excludeColumns ?? []);
		};

		const updateRanges = (nextRanges: FoldRanges) => {
			form.setFieldValue("libraryRange", nextRanges.libraryRange);
			form.setFieldValue("predictionRange", nextRanges.predictionRange);
			form.setFieldValue("holdoutRange", nextRanges.holdoutRange);
		};

		const updateBackendSideEffects = (backend: AnalysisBackend) => {
			const next = setBackend({ ...form.state.values, backend }, backend, { columnNames });
			form.setFieldValue("targets", next.targets, { dontRunListeners: true });
			form.setFieldValue("excludeColumns", next.excludeColumns ?? [], { dontRunListeners: true });
		};

		return (
			<Grid templateColumns={{ base: "1fr", xl: "minmax(0, 1fr) 380px" }} gap={6} alignItems="start">
				<Stack gap={6} minW={0}>
					<VariableRoleTable
						columns={columns}
						settings={settings}
						onRoleChange={updateRole}
						selectedVariable={selectedVariable}
						onSelectVariable={onSelectVariable}
						isLoading={isDatasetLoading}
						error={datasetError}
					/>
					<PreviewPanel variable={selectedVariable} data={previewData} isLoading={isPreviewLoading} error={previewError} />
				</Stack>

				<Stack gap={6} minW={0}>
					<RunParametersPanel
						totalPoints={totalPoints}
						ranges={ranges}
						onRangesChange={updateRanges}
						backendField={
							<form.AppField
								name="backend"
								listeners={{
									onChange: ({ value }) => {
										if (value === "edmkit" || value === "dimx") {
											updateBackendSideEffects(value);
										}
									},
								}}
							>
								{(field) => <field.BackendSegmentField />}
							</form.AppField>
						}
						maxVariablesField={
							<form.AppField name="maxVariables">
								{(field) => <field.NumberInputField label="Maximum variables to select" min={1} step={1} />}
							</form.AppField>
						}
						prefilterThresholdField={
							<form.AppField name="prefilterThreshold">
								{(field) => (
									<field.NumberInputField
										label="Pre-filter rho threshold"
										min={0}
										max={1}
										step={0.01}
										helperText="Drop candidates whose best univariate embedded rho on the library + prediction rows is below this value. Set to 0 to disable."
									/>
								)}
							</form.AppField>
						}
						seedField={
							<form.AppField name="seed">{(field) => <field.NumberInputField label="Random seed" step={1} />}</form.AppField>
						}
					/>
					<Panel>
						<Stack gap={4}>
							{runError ? <ErrorState title="Run could not be started" description={runError} /> : null}
							<ValidationSummary issues={validationIssues} />
							<Flex justify="flex-end" gap={2} wrap="wrap">
								<form.AppForm>
									<form.SubmitButton colorPalette="blue" disabled={validationIssues.length > 0}>
										{submitLabel}
									</form.SubmitButton>
								</form.AppForm>
							</Flex>
						</Stack>
					</Panel>
				</Stack>
			</Grid>
		);
	},
});

function RunParametersPanel({
	backendField,
	maxVariablesField,
	prefilterThresholdField,
	seedField,
	ranges,
	onRangesChange,
	totalPoints,
}: {
	backendField: ReactNode;
	maxVariablesField: ReactNode;
	prefilterThresholdField: ReactNode;
	seedField: ReactNode;
	ranges: FoldRanges;
	onRangesChange: (ranges: FoldRanges) => void;
	totalPoints: number;
}) {
	return (
		<Panel
			eyebrow="Settings"
			title="Run parameters"
			description="Control the greedy search limit, fold layout, and reproducibility seed."
		>
			<Stack gap={5}>
				{backendField}
				{maxVariablesField}
				{prefilterThresholdField}

				<Stack gap={2}>
					<Text fontWeight="medium">Fold layout</Text>
					{totalPoints > 0 ? (
						<FoldRangeSlider totalPoints={totalPoints} ranges={ranges} onRangesChange={onRangesChange} />
					) : (
						<Text color="fg.muted">Fold ranges are available after the dataset summary loads.</Text>
					)}
				</Stack>

				{seedField}
			</Stack>
		</Panel>
	);
}

function PreviewPanel({
	variable,
	data,
	isLoading,
	error,
}: {
	variable?: string | null;
	data?: number[] | null;
	isLoading: boolean;
	error?: string | null;
}) {
	const width = Math.max(640, Math.min((data?.length ?? 0) * 2, 1400));

	return (
		<Panel title="Time series preview" description="Inspect the selected variable before running the analysis.">
			{!variable ? (
				<Text color="fg.muted">Select a variable to preview its raw time series.</Text>
			) : isLoading ? (
				<LoadingState title={`Loading ${variable}`} />
			) : error ? (
				<ErrorState title="Preview is unavailable" description={error} />
			) : data && data.length > 0 ? (
				<ChartScrollArea ariaLabel={`${variable} time series preview`} minWidth={width}>
					<LinePlot data={data} width={width} height={320} />
				</ChartScrollArea>
			) : (
				<Text color="fg.muted">No preview data is available for {variable}.</Text>
			)}
		</Panel>
	);
}

function ValidationSummary({ issues }: { issues: SettingsValidationIssue[] }) {
	if (issues.length === 0) {
		return null;
	}

	return <ErrorState title="Settings need attention" description={issues.map((issue) => issue.message).join(" ")} />;
}
