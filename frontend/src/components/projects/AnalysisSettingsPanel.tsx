import { useCallback } from "react";

import { Box, Checkbox, CheckboxGroup, Input, Stack, Text } from "@chakra-ui/react";

interface AnalysisSettingsPanelProps {
	columnNames: string[];
	target: string;
	onTargetChange: (value: string) => void;
	dimensions: number;
	onDimensionsChange: (value: number) => void;
	removeColumns: string[];
	onToggleIgnore: (column: string, checked: boolean) => void;
	libRange: [number, number];
	onLibraryRangeChange: (range: [number, number]) => void;
	predRange: [number, number];
	onPredictionRangeChange: (range: [number, number]) => void;
}

export function AnalysisSettingsPanel({
	columnNames,
	target,
	onTargetChange,
	dimensions,
	onDimensionsChange,
	removeColumns,
	onToggleIgnore,
	libRange,
	onLibraryRangeChange,
	predRange,
	onPredictionRangeChange,
}: AnalysisSettingsPanelProps) {
	const [libStart, libEnd] = libRange;
	const [predStart, predEnd] = predRange;
	const ignoreValues = removeColumns.filter((name) => name !== target);

	const handleIgnoreChange = useCallback(
		(values: string[]) => {
			const sanitizedValues = values.filter((value) => value !== target);
			const previous = new Set(removeColumns.filter((name) => name !== target));
			const next = new Set(sanitizedValues);

			sanitizedValues.forEach((value) => {
				if (!previous.has(value)) {
					onToggleIgnore(value, true);
				}
			});

			previous.forEach((value) => {
				if (!next.has(value)) {
					onToggleIgnore(value, false);
				}
			});
		},
		[removeColumns, onToggleIgnore, target],
	);

	return (
		<Box bg="white" borderRadius="xl" boxShadow="sm" p={6}>
			<Stack gap={5}>
				<Stack gap={1}>
					<Text as="h3" fontSize="lg" fontWeight="semibold">
						Analysis settings
					</Text>
					<Text color="fg.muted">These parameters control how the embedding is constructed.</Text>
				</Stack>

				<Stack direction={{ base: "column", md: "row" }} gap={4}>
					<Stack flex="1" gap={2}>
						<Text fontWeight="medium">Target variable</Text>
						<select
							value={target}
							onChange={(event) => onTargetChange(event.target.value)}
							style={{
								padding: "0.6rem",
								borderRadius: "0.5rem",
								borderWidth: "1px",
								borderStyle: "solid",
								borderColor: "var(--chakra-colors-gray-200)",
							}}
						>
							<option value="" disabled>
								Select target
							</option>
							{columnNames.map((name) => (
								<option key={name} value={name}>
									{name}
								</option>
							))}
						</select>
						<Text fontSize="sm" color="fg.muted">
							Optimises prediction skill for the selected variable.
						</Text>
					</Stack>

					<Stack flex="1" gap={2}>
						<Text fontWeight="medium">Embedding dimensions (D)</Text>
						<Input
							type="number"
							min={1}
							value={Number.isFinite(dimensions) ? dimensions : ""}
							onChange={(event) => {
								const value = Number.parseInt(event.target.value, 10);
								onDimensionsChange(Number.isNaN(value) ? 1 : Math.max(1, value));
							}}
						/>
						<Text fontSize="sm" color="fg.muted">
							Maximum embedding dimensions explored during optimisation.
						</Text>
					</Stack>
				</Stack>

				<Stack gap={2}>
					<Text fontWeight="medium">Ignore variables during optimisation</Text>
					<CheckboxGroup value={ignoreValues} onValueChange={handleIgnoreChange}>
						<Stack gap={2} maxH="200px" overflowY="auto">
							{columnNames.map((name) => (
								<Checkbox.Root key={name} value={name} disabled={name === target}>
									<Checkbox.HiddenInput />
									<Checkbox.Control />
									<Checkbox.Label>{name}</Checkbox.Label>
								</Checkbox.Root>
							))}
						</Stack>
					</CheckboxGroup>
					<Text fontSize="sm" color="fg.muted">
						Select any variables that should be excluded from optimisation.
					</Text>
				</Stack>

				<Stack direction={{ base: "column", md: "row" }} gap={4}>
					<Stack flex="1" gap={2}>
						<Text fontWeight="medium">Library range</Text>
						<Stack direction="row" gap={3}>
							<Input
								type="number"
								min={1}
								value={libStart}
								onChange={(event) => {
									const value = Math.max(1, Math.floor(Number(event.target.value) || 1));
									onLibraryRangeChange([value, Math.max(value + 1, libEnd)]);
								}}
							/>
							<Input
								type="number"
								min={libStart + 1}
								value={libEnd}
								onChange={(event) => {
									const value = Math.floor(Number(event.target.value) || libStart + 1);
									onLibraryRangeChange([libStart, Math.max(libStart + 1, value)]);
								}}
							/>
						</Stack>
						<Text fontSize="sm" color="fg.muted">
							Inclusive start and end for the library segment.
						</Text>
					</Stack>

					<Stack flex="1" gap={2}>
						<Text fontWeight="medium">Prediction range</Text>
						<Stack direction="row" gap={3}>
							<Input
								type="number"
								min={1}
								value={predStart}
								onChange={(event) => {
									const value = Math.max(1, Math.floor(Number(event.target.value) || 1));
									onPredictionRangeChange([value, Math.max(value + 1, predEnd)]);
								}}
							/>
							<Input
								type="number"
								min={predStart + 1}
								value={predEnd}
								onChange={(event) => {
									const value = Math.floor(Number(event.target.value) || predStart + 1);
									onPredictionRangeChange([predStart, Math.max(predStart + 1, value)]);
								}}
							/>
						</Stack>
						<Text fontSize="sm" color="fg.muted">
							Inclusive start and end for the prediction segment.
						</Text>
					</Stack>
				</Stack>
			</Stack>
		</Box>
	);
}
