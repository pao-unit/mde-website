import { Box, Checkbox, CheckboxGroup, Input, Stack, Text } from "@chakra-ui/react";
import { FoldRangeSlider } from "./FoldRangeSlider.tsx";

interface AnalysisSettingsPanelProps {
	columnNames: string[];
	totalPoints: number;
	targets: string[];
	onTargetsChange: (values: string[]) => void;
	maxVariables: number;
	onMaxVariablesChange: (value: number) => void;
	excludeColumns: string[];
	onToggleExclude: (column: string, checked: boolean) => void;
	libraryRange: [number, number];
	onLibraryRangeChange: (range: [number, number]) => void;
	predictionRange: [number, number];
	onPredictionRangeChange: (range: [number, number]) => void;
	holdoutRange: [number, number];
	onHoldoutRangeChange: (range: [number, number]) => void;
	seed: number;
	onSeedChange: (value: number) => void;
}

export function AnalysisSettingsPanel({
	columnNames,
	totalPoints,
	targets,
	onTargetsChange,
	maxVariables,
	onMaxVariablesChange,
	excludeColumns,
	onToggleExclude,
	libraryRange,
	onLibraryRangeChange,
	predictionRange,
	onPredictionRangeChange,
	holdoutRange,
	onHoldoutRangeChange,
	seed,
	onSeedChange,
}: AnalysisSettingsPanelProps) {
	const targetSet = new Set(targets);
	const excludeValues = excludeColumns.filter((name) => !targetSet.has(name));

	const handleExcludeChange = (values: string[]) => {
		const sanitizedValues = values.filter((value) => !targetSet.has(value));
		const previous = new Set(excludeColumns.filter((name) => !targetSet.has(name)));
		const next = new Set(sanitizedValues);

		for (const value of sanitizedValues) {
			if (!previous.has(value)) {
				onToggleExclude(value, true);
			}
		}

		for (const value of previous) {
			if (!next.has(value)) {
				onToggleExclude(value, false);
			}
		}
	};

	return (
		<Box bg="white" borderRadius="xl" boxShadow="sm" p={6}>
			<Stack gap={5}>
				<Stack gap={1}>
					<Text as="h3" fontSize="lg" fontWeight="semibold">
						Analysis settings
					</Text>
					<Text color="fg.muted">
						Greedy forward selection scores candidates on the Training (prediction) range. The Holdout range is reserved for final
						evaluation.
					</Text>
				</Stack>

				<Stack gap={2}>
					<Text fontWeight="medium">Target variables</Text>
					<CheckboxGroup value={targets} onValueChange={onTargetsChange}>
						<Stack gap={2} maxH="200px" overflowY="auto">
							{columnNames.map((name) => (
								<Checkbox.Root key={name} value={name}>
									<Checkbox.HiddenInput />
									<Checkbox.Control />
									<Checkbox.Label>{name}</Checkbox.Label>
								</Checkbox.Root>
							))}
						</Stack>
					</CheckboxGroup>
					<Text fontSize="sm" color="fg.muted">
						Predicted jointly. Targets are automatically excluded from the candidate pool.
					</Text>
				</Stack>

				<Stack gap={2}>
					<Text fontWeight="medium">Maximum variables to select</Text>
					<Input
						type="number"
						min={1}
						value={Number.isFinite(maxVariables) ? maxVariables : ""}
						onChange={(event) => {
							const value = Number.parseInt(event.target.value, 10);
							onMaxVariablesChange(Number.isNaN(value) ? 1 : Math.max(1, value));
						}}
					/>
					<Text fontSize="sm" color="fg.muted">
						Greedy search stops once this many variables have been chosen.
					</Text>
				</Stack>

				<Stack gap={2}>
					<Text fontWeight="medium">Exclude additional variables</Text>
					<CheckboxGroup value={excludeValues} onValueChange={handleExcludeChange}>
						<Stack gap={2} maxH="200px" overflowY="auto">
							{columnNames.map((name) => (
								<Checkbox.Root key={name} value={name} disabled={targetSet.has(name)}>
									<Checkbox.HiddenInput />
									<Checkbox.Control />
									<Checkbox.Label>
										{name}
										{targetSet.has(name) ? " (target — auto-excluded)" : null}
									</Checkbox.Label>
								</Checkbox.Root>
							))}
						</Stack>
					</CheckboxGroup>
				</Stack>

				<Stack gap={2}>
					<Text fontWeight="medium">Fold layout</Text>
					<FoldRangeSlider
						totalPoints={totalPoints}
						libraryRange={libraryRange}
						predictionRange={predictionRange}
						holdoutRange={holdoutRange}
						onLibraryRangeChange={onLibraryRangeChange}
						onPredictionRangeChange={onPredictionRangeChange}
						onHoldoutRangeChange={onHoldoutRangeChange}
					/>
					<Text fontSize="sm" color="fg.muted">
						1-indexed inclusive point ranges. Library is the simplex library throughout. Prediction is the held-out target during
						greedy variable selection. Holdout is the final out-of-sample test for the actual-vs-predicted plot.
					</Text>
				</Stack>

				<Stack gap={2}>
					<Text fontWeight="medium">Random seed</Text>
					<Input
						type="number"
						value={seed}
						onChange={(event) => {
							const value = Number.parseInt(event.target.value, 10);
							onSeedChange(Number.isNaN(value) ? 0 : value);
						}}
					/>
					<Text fontSize="sm" color="fg.muted">
						Ensures runs are reproducible. Greedy ties are broken by per-step randomness.
					</Text>
				</Stack>
			</Stack>
		</Box>
	);
}
