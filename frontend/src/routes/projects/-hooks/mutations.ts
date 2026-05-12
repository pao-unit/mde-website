import { type UseMutationOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AnalysisRun, ProjectSettings, ProjectSummary } from "../-utils/model.ts";
import { sanitizeSettings, SettingsValidationError, type SettingsOptions, validateSettings } from "../-utils/settings.ts";
import { $api, fetchClient } from "../../../shared/api/client.ts";

export type CreateProjectVariables = {
	file: File;
};

export type RunAnalysisOptions = Omit<UseMutationOptions<AnalysisRun, Error, ProjectSettings>, "mutationFn"> & SettingsOptions;

export function useCreateProject(
	options?: Omit<UseMutationOptions<ProjectSummary, Error, CreateProjectVariables>, "mutationFn">,
) {
	const queryClient = useQueryClient();

	return useMutation({
		...options,
		mutationFn: async ({ file }) => {
			const form = new FormData();
			form.append("file", file, encodeURI(file.name));
			const { data, error } = await fetchClient.POST("/api/projects", {
				body: { file },
				bodySerializer: () => form,
			});
			if (error || !data) {
				throw toMutationError(error);
			}
			return data;
		},
		onSuccess(project, variables, onMutateResult, context) {
			void queryClient.invalidateQueries({ queryKey: $api.queryOptions("get", "/api/projects").queryKey });
			options?.onSuccess?.(project, variables, onMutateResult, context);
		},
	});
}

export function useRunAnalysis(projectId: string, options?: RunAnalysisOptions) {
	const queryClient = useQueryClient();
	const { columnNames, defaultRanges, totalPoints, ...mutationOptions } = options ?? {};

	return useMutation({
		...mutationOptions,
		mutationFn: async (draft) => {
			const settings = sanitizeSettings(draft, { columnNames, defaultRanges, totalPoints });
			const issues = validateSettings(settings, { columnNames, totalPoints });
			if (issues.length > 0) {
				throw new SettingsValidationError(issues);
			}

			const { data, error } = await fetchClient.POST("/api/projects/{project_id}/runs", {
				params: { path: { project_id: projectId } },
				body: settings,
			});
			if (error || !data) {
				throw toMutationError(error);
			}
			return data;
		},
		onSuccess(run, variables, onMutateResult, context) {
			void queryClient.invalidateQueries({ queryKey: $api.queryOptions("get", "/api/projects").queryKey });
			void queryClient.invalidateQueries({
				queryKey: $api.queryOptions("get", "/api/projects/{project_id}", {
					params: { path: { project_id: projectId } },
				}).queryKey,
			});
			mutationOptions.onSuccess?.(run, variables, onMutateResult, context);
		},
	});
}

function toMutationError(error: unknown): Error {
	if (error instanceof Error) {
		return error;
	}
	if (error && typeof error === "object" && "detail" in error) {
		const { detail } = error;
		if (typeof detail === "string" && detail.trim()) {
			return new Error(detail);
		}
		if (Array.isArray(detail) && detail.length > 0) {
			const first: unknown = detail[0];
			if (first && typeof first === "object" && "msg" in first && typeof first.msg === "string") {
				return new Error(first.msg);
			}
		}
	}
	return new Error("Request failed.");
}
