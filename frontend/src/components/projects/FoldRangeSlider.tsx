import { Box, HStack, Input, Stack, Text } from "@chakra-ui/react";
import { useEffect, useId, useRef, useState } from "react";

interface FoldRangeSliderProps {
	totalPoints: number;
	libraryRange: [number, number];
	predictionRange: [number, number];
	holdoutRange: [number, number];
	onLibraryRangeChange: (range: [number, number]) => void;
	onPredictionRangeChange: (range: [number, number]) => void;
	onHoldoutRangeChange: (range: [number, number]) => void;
}

type ThumbKey = "t1" | "t2" | "t3" | "t4" | "t5" | "t6";

const THUMB_KEYS: ThumbKey[] = ["t1", "t2", "t3", "t4", "t5", "t6"];

const LIBRARY_COLOR = "blue.400";
const PREDICTION_COLOR = "teal.400";
const HOLDOUT_COLOR = "orange.400";

const REGION_OF: Record<ThumbKey, "library" | "prediction" | "holdout"> = {
	t1: "library",
	t2: "library",
	t3: "prediction",
	t4: "prediction",
	t5: "holdout",
	t6: "holdout",
};

const COLOR_OF = {
	library: LIBRARY_COLOR,
	prediction: PREDICTION_COLOR,
	holdout: HOLDOUT_COLOR,
} as const;

export function FoldRangeSlider({
	totalPoints,
	libraryRange,
	predictionRange,
	holdoutRange,
	onLibraryRangeChange,
	onPredictionRangeChange,
	onHoldoutRangeChange,
}: FoldRangeSliderProps) {
	const min = 1;
	const max = Math.max(totalPoints, 1);
	const trackRef = useRef<HTMLDivElement | null>(null);
	const [dragging, setDragging] = useState<ThumbKey | null>(null);
	const reactId = useId();

	const values = {
		t1: clamp(libraryRange[0], min, max),
		t2: clamp(libraryRange[1], min, max),
		t3: clamp(predictionRange[0], min, max),
		t4: clamp(predictionRange[1], min, max),
		t5: clamp(holdoutRange[0], min, max),
		t6: clamp(holdoutRange[1], min, max),
	};

	const commit = (key: ThumbKey, raw: number) => {
		const rounded = Math.round(raw);
		const current = { ...values };
		current[key] = rounded;

		// Enforce t1 <= t2 <= t3 <= t4 <= t5 <= t6 by clamping against neighbors.
		const next = { ...values };
		if (key === "t1") next.t1 = clamp(current.t1, min, values.t2);
		if (key === "t2") next.t2 = clamp(current.t2, next.t1, values.t3);
		if (key === "t3") next.t3 = clamp(current.t3, values.t2, values.t4);
		if (key === "t4") next.t4 = clamp(current.t4, next.t3, values.t5);
		if (key === "t5") next.t5 = clamp(current.t5, values.t4, values.t6);
		if (key === "t6") next.t6 = clamp(current.t6, next.t5, max);

		const libChanged = next.t1 !== values.t1 || next.t2 !== values.t2;
		const predChanged = next.t3 !== values.t3 || next.t4 !== values.t4;
		const holdChanged = next.t5 !== values.t5 || next.t6 !== values.t6;

		if (libChanged) onLibraryRangeChange([next.t1, next.t2]);
		if (predChanged) onPredictionRangeChange([next.t3, next.t4]);
		if (holdChanged) onHoldoutRangeChange([next.t5, next.t6]);
	};

	const valueFromClientX = (clientX: number) => {
		const track = trackRef.current;
		if (!track) return min;
		const rect = track.getBoundingClientRect();
		const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
		return min + ratio * (max - min);
	};

	const startDrag = (key: ThumbKey) => (event: React.PointerEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.currentTarget.setPointerCapture?.(event.pointerId);
		setDragging(key);
	};

	// Keep latest commit / valueFromClientX in refs so the window-listener effect
	// below does not need to re-subscribe on every render (these are recreated
	// each render now that manual memoization is gone).
	const commitRef = useRef(commit);
	commitRef.current = commit;
	const valueFromClientXRef = useRef(valueFromClientX);
	valueFromClientXRef.current = valueFromClientX;

	useEffect(() => {
		if (!dragging) return undefined;

		const onMove = (event: PointerEvent) => {
			commitRef.current(dragging, valueFromClientXRef.current(event.clientX));
		};
		const onUp = () => setDragging(null);

		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
		window.addEventListener("pointercancel", onUp);
		return () => {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
			window.removeEventListener("pointercancel", onUp);
		};
	}, [dragging]);

	const onTrackPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
		const point = valueFromClientX(event.clientX);
		const nearest = THUMB_KEYS.reduce<{ key: ThumbKey; dist: number }>(
			(best, key) => {
				const dist = Math.abs(values[key] - point);
				return dist < best.dist ? { key, dist } : best;
			},
			{ key: "t1", dist: Number.POSITIVE_INFINITY },
		);
		commit(nearest.key, point);
		setDragging(nearest.key);
	};

	const onKeyDown = (key: ThumbKey) => (event: React.KeyboardEvent<HTMLDivElement>) => {
		const step = event.shiftKey ? Math.max(1, Math.round((max - min) / 20)) : 1;
		if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
			event.preventDefault();
			commit(key, values[key] - step);
		} else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
			event.preventDefault();
			commit(key, values[key] + step);
		} else if (event.key === "Home") {
			event.preventDefault();
			commit(key, min);
		} else if (event.key === "End") {
			event.preventDefault();
			commit(key, max);
		}
	};

	const pct = (v: number) => ((v - min) / Math.max(1, max - min)) * 100;

	const librarySize = Math.max(0, values.t2 - values.t1 + 1);
	const predictionSize = Math.max(0, values.t4 - values.t3 + 1);
	const holdoutSize = Math.max(0, values.t6 - values.t5 + 1);

	return (
		<Stack gap={4}>
			<HStack gap={4} wrap="wrap" justify="space-between" align="baseline">
				<HStack gap={4} wrap="wrap">
					<Legend color={LIBRARY_COLOR} label="Training (library)" range={[values.t1, values.t2]} size={librarySize} />
					<Legend color={PREDICTION_COLOR} label="Training (prediction)" range={[values.t3, values.t4]} size={predictionSize} />
					<Legend color={HOLDOUT_COLOR} label="Holdout" range={[values.t5, values.t6]} size={holdoutSize} />
				</HStack>
				<Text fontSize="xs" color="fg.muted">
					Points 1 – {max.toLocaleString()}
				</Text>
			</HStack>

			<Box position="relative" pt={8} pb={10} touchAction="none" userSelect="none">
				<Box
					ref={trackRef}
					position="relative"
					h="6px"
					bg="gray.200"
					borderRadius="full"
					onPointerDown={onTrackPointerDown}
					cursor="pointer"
				>
					<Region color={LIBRARY_COLOR} startPct={pct(values.t1)} endPct={pct(values.t2)} />
					<Region color={PREDICTION_COLOR} startPct={pct(values.t3)} endPct={pct(values.t4)} />
					<Region color={HOLDOUT_COLOR} startPct={pct(values.t5)} endPct={pct(values.t6)} />

					{THUMB_KEYS.map((key) => {
						const region = REGION_OF[key];
						const color = COLOR_OF[region];
						const isStart = key === "t1" || key === "t3" || key === "t5";
						return (
							<Box
								key={key}
								role="slider"
								tabIndex={0}
								aria-valuemin={min}
								aria-valuemax={max}
								aria-valuenow={values[key]}
								aria-label={`${labelFor(region)} ${isStart ? "start" : "end"}`}
								id={`${reactId}-${key}`}
								onPointerDown={startDrag(key)}
								onKeyDown={onKeyDown(key)}
								position="absolute"
								top="50%"
								left={`${pct(values[key])}%`}
								transform="translate(-50%, -50%)"
								w="22px"
								h="22px"
								bg="white"
								borderWidth="2px"
								borderColor={color}
								borderRadius="full"
								boxShadow={dragging === key ? "0 0 0 6px rgba(66,153,225,0.18)" : "sm"}
								cursor="grab"
								touchAction="none"
								_active={{ cursor: "grabbing" }}
								_focusVisible={{ outline: "2px solid", outlineColor: "blue.500", outlineOffset: "2px" }}
							>
								<Box
									position="absolute"
									top="-26px"
									left="50%"
									transform="translateX(-50%)"
									fontSize="xs"
									color="fg.muted"
									whiteSpace="nowrap"
									pointerEvents="none"
								>
									{values[key].toLocaleString()}
								</Box>
							</Box>
						);
					})}
				</Box>
			</Box>

			<Stack direction={{ base: "column", md: "row" }} gap={4} wrap="wrap">
				<NumberPair
					label="Training (library)"
					color={LIBRARY_COLOR}
					start={values.t1}
					end={values.t2}
					startBounds={[min, values.t2]}
					endBounds={[values.t1, values.t3]}
					onStart={(v) => commit("t1", v)}
					onEnd={(v) => commit("t2", v)}
				/>
				<NumberPair
					label="Training (prediction)"
					color={PREDICTION_COLOR}
					start={values.t3}
					end={values.t4}
					startBounds={[values.t2, values.t4]}
					endBounds={[values.t3, values.t5]}
					onStart={(v) => commit("t3", v)}
					onEnd={(v) => commit("t4", v)}
				/>
				<NumberPair
					label="Holdout"
					color={HOLDOUT_COLOR}
					start={values.t5}
					end={values.t6}
					startBounds={[values.t4, values.t6]}
					endBounds={[values.t5, max]}
					onStart={(v) => commit("t5", v)}
					onEnd={(v) => commit("t6", v)}
				/>
			</Stack>
		</Stack>
	);
}

function labelFor(region: "library" | "prediction" | "holdout") {
	if (region === "library") return "Training (library)";
	if (region === "prediction") return "Training (prediction)";
	return "Holdout";
}

function Region({ color, startPct, endPct }: { color: string; startPct: number; endPct: number }) {
	return (
		<Box
			position="absolute"
			top={0}
			bottom={0}
			left={`${startPct}%`}
			width={`${Math.max(0, endPct - startPct)}%`}
			bg={color}
			borderRadius="full"
		/>
	);
}

function Legend({ color, label, range, size }: { color: string; label: string; range: [number, number]; size: number }) {
	return (
		<HStack gap={2}>
			<Box w="10px" h="10px" borderRadius="full" bg={color} />
			<Text fontSize="sm" fontWeight="medium">
				{label}
			</Text>
			<Text fontSize="sm" color="fg.muted">
				{range[0].toLocaleString()} – {range[1].toLocaleString()} ({size.toLocaleString()} points)
			</Text>
		</HStack>
	);
}

function NumberPair({
	label,
	color,
	start,
	end,
	startBounds,
	endBounds,
	onStart,
	onEnd,
}: {
	label: string;
	color: string;
	start: number;
	end: number;
	startBounds: [number, number];
	endBounds: [number, number];
	onStart: (v: number) => void;
	onEnd: (v: number) => void;
}) {
	return (
		<Stack gap={2} flex="1" minW="200px">
			<HStack gap={2}>
				<Box w="8px" h="8px" borderRadius="full" bg={color} />
				<Text fontSize="xs" color="fg.muted">
					{label}
				</Text>
			</HStack>
			<HStack gap={2}>
				<NumberField value={start} min={startBounds[0]} max={startBounds[1]} onCommit={onStart} />
				<Text fontSize="xs" color="fg.muted">
					–
				</Text>
				<NumberField value={end} min={endBounds[0]} max={endBounds[1]} onCommit={onEnd} />
			</HStack>
		</Stack>
	);
}

function NumberField({
	value,
	min,
	max,
	onCommit,
}: {
	value: number;
	min: number;
	max: number;
	onCommit: (value: number) => void;
}) {
	const [prevValue, setPrevValue] = useState(value);
	const [text, setText] = useState(String(value));
	if (prevValue !== value) {
		setPrevValue(value);
		setText(String(value));
	}

	return (
		<Input
			type="number"
			size="sm"
			value={text}
			min={min}
			max={max}
			onChange={(event) => setText(event.target.value)}
			onBlur={() => {
				const parsed = Number.parseInt(text, 10);
				if (Number.isFinite(parsed)) {
					onCommit(parsed);
				} else {
					setText(String(value));
				}
			}}
			onKeyDown={(event) => {
				if (event.key === "Enter") {
					event.currentTarget.blur();
				}
			}}
		/>
	);
}

function clamp(v: number, lo: number, hi: number) {
	return Math.min(Math.max(v, lo), hi);
}
