import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "../../libs/api/openapi.gen.ts";

export const apiBaseUrl = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_BASE_URL ?? "");

export const fetchClient = createFetchClient<paths>({
	baseUrl: apiBaseUrl,
});

export const $api = createClient(fetchClient);

export function getErrorMessage(error: unknown): string {
	if (error && typeof error === "object" && "detail" in error) {
		const { detail } = error;
		if (typeof detail === "string" && detail.trim()) {
			return detail;
		}
		if (Array.isArray(detail) && detail.length > 0) {
			const first: unknown = detail[0];
			if (first && typeof first === "object" && "msg" in first && typeof first.msg === "string" && first.msg.trim()) {
				return first.msg;
			}
		}
	}

	if (error instanceof Error) {
		return error.message;
	}

	if (typeof error === "string" && error.trim()) {
		return error;
	}

	return "Something went wrong.";
}
