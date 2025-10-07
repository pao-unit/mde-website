export interface paths {
	"/api/projects": {
		parameters: {
			query?: never;
			header?: never;
			path?: never;
			cookie?: never;
		};
		get?: never;
		put?: never;
		/** Create Project */
		post: operations["create_project_api_projects_post"];
		delete?: never;
		options?: never;
		head?: never;
		patch?: never;
		trace?: never;
	};
	"/api/projects/{project_id}/settings": {
		parameters: {
			query?: never;
			header?: never;
			path?: never;
			cookie?: never;
		};
		get?: never;
		put?: never;
		/** Run */
		post: operations["run_api_projects__project_id__settings_post"];
		delete?: never;
		options?: never;
		head?: never;
		patch?: never;
		trace?: never;
	};
	"/api/projects/{project_id}/variables": {
		parameters: {
			query?: never;
			header?: never;
			path?: never;
			cookie?: never;
		};
		/** Get Variables */
		get: operations["get_variables_api_projects__project_id__variables_get"];
		put?: never;
		post?: never;
		delete?: never;
		options?: never;
		head?: never;
		patch?: never;
		trace?: never;
	};
	"/api/projects/{project_id}/dataset": {
		parameters: {
			query?: never;
			header?: never;
			path?: never;
			cookie?: never;
		};
		/** Get Dataset Overview */
		get: operations["get_dataset_overview_api_projects__project_id__dataset_get"];
		put?: never;
		post?: never;
		delete?: never;
		options?: never;
		head?: never;
		patch?: never;
		trace?: never;
	};
	"/api/projects/{project_id}": {
		parameters: {
			query?: never;
			header?: never;
			path?: never;
			cookie?: never;
		};
		/** Get Project */
		get: operations["get_project_api_projects__project_id__get"];
		put?: never;
		post?: never;
		delete?: never;
		options?: never;
		head?: never;
		patch?: never;
		trace?: never;
	};
}
export type webhooks = Record<string, never>;
export interface components {
	schemas: {
		/** Body_create_project_api_projects_post */
		Body_create_project_api_projects_post: {
			/**
			 * File
			 * Format: binary
			 */
			file: Blob;
		};
		/** ColumnSummary */
		ColumnSummary: {
			/**
			 * Name
			 * @description Column name
			 * @example column1
			 */
			name: string;
			/**
			 * Missing
			 * @description Number of missing values
			 * @example 0
			 */
			missing: number;
			/**
			 * Mean
			 * @description Mean value
			 * @example 0.42
			 */
			mean: number | null;
			/**
			 * Std
			 * @description Standard deviation
			 * @example 0.12
			 */
			std: number | null;
			/**
			 * Min
			 * @description Minimum value
			 * @example -0.4
			 */
			min: number | null;
			/**
			 * Q1
			 * @description 25th percentile
			 * @example 0.3
			 */
			q1: number | null;
			/**
			 * Q2
			 * @description 50th percentile (median)
			 * @example 0.5
			 */
			q2: number | null;
			/**
			 * Q3
			 * @description 75th percentile
			 * @example 0.6
			 */
			q3: number | null;
			/**
			 * Max
			 * @description Maximum value
			 * @example 0.9
			 */
			max: number | null;
			/**
			 * Dtype
			 * @description Pandas dtype
			 * @example float64
			 */
			dtype: string;
		};
		/** DatasetOverview */
		DatasetOverview: {
			/**
			 * Rowcount
			 * @description Total number of rows
			 * @example 600
			 */
			rowCount: number;
			/**
			 * Columns
			 * @description Per-column summaries
			 */
			columns: components["schemas"]["ColumnSummary"][];
		};
		/** GetProjectResponse */
		GetProjectResponse: {
			/**
			 * Id
			 * @description The unique identifier for the project
			 * @example project_01k6wba7gzecgakd2fr2jkx9z8
			 */
			id: string;
			/**
			 * Filename
			 * @description The uploaded file name
			 * @example data.csv
			 * @example data.parquet.zstd
			 */
			filename: string;
			/**
			 * @description MDE settings
			 * @example null
			 */
			settings: components["schemas"]["Settings"] | null;
			/**
			 * Result
			 * @description MDE result
			 * @example null
			 */
			result: {
				[key: string]: number;
			} | null;
		};
		/** HTTPValidationError */
		HTTPValidationError: {
			/** Detail */
			detail?: components["schemas"]["ValidationError"][];
		};
		/** Project */
		Project: {
			/**
			 * Id
			 * @description The unique identifier for the project
			 * @example project_01k6wba7gzecgakd2fr2jkx9z8
			 */
			id: string;
			/**
			 * Filename
			 * @description The uploaded file name
			 * @example data.csv
			 * @example data.parquet.zstd
			 */
			filename: string;
		};
		/** Settings */
		Settings: {
			/**
			 * Target
			 * @description The target column name
			 * @example target
			 */
			target: string;
			/**
			 * Removecolumns
			 * @description Columns to remove
			 * @example [
			 *       "index",
			 *       "FWD",
			 *       "Left_Right"
			 *     ]
			 */
			removeColumns: string[];
			/**
			 * D
			 * @description The number of dimensions
			 * @example 10
			 */
			D: number;
			/**
			 * Lib
			 * @description Library range to use
			 * @example [
			 *       1,
			 *       300
			 *     ]
			 */
			lib: number[];
			/**
			 * Pred
			 * @description Prediction range to use
			 * @example [
			 *       301,
			 *       600
			 *     ]
			 */
			pred: number[];
		};
		/** ValidationError */
		ValidationError: {
			/** Location */
			loc: (string | number)[];
			/** Message */
			msg: string;
			/** Error Type */
			type: string;
		};
	};
	responses: never;
	parameters: never;
	requestBodies: never;
	headers: never;
	pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
	create_project_api_projects_post: {
		parameters: {
			query?: never;
			header?: never;
			path?: never;
			cookie?: never;
		};
		requestBody: {
			content: {
				"multipart/form-data": components["schemas"]["Body_create_project_api_projects_post"];
			};
		};
		responses: {
			/** @description Successful Response */
			200: {
				headers: {
					[name: string]: unknown;
				};
				content: {
					"application/json": components["schemas"]["Project"];
				};
			};
			/** @description Validation Error */
			422: {
				headers: {
					[name: string]: unknown;
				};
				content: {
					"application/json": components["schemas"]["HTTPValidationError"];
				};
			};
		};
	};
	run_api_projects__project_id__settings_post: {
		parameters: {
			query?: never;
			header?: never;
			path: {
				project_id: string;
			};
			cookie?: never;
		};
		requestBody: {
			content: {
				"application/json": components["schemas"]["Settings"];
			};
		};
		responses: {
			/** @description Successful Response */
			200: {
				headers: {
					[name: string]: unknown;
				};
				content: {
					"application/json": unknown;
				};
			};
			/** @description Validation Error */
			422: {
				headers: {
					[name: string]: unknown;
				};
				content: {
					"application/json": components["schemas"]["HTTPValidationError"];
				};
			};
		};
	};
	get_variables_api_projects__project_id__variables_get: {
		parameters: {
			query: {
				variables: string[];
			};
			header?: never;
			path: {
				project_id: string;
			};
			cookie?: never;
		};
		requestBody?: never;
		responses: {
			/** @description Successful Response */
			200: {
				headers: {
					[name: string]: unknown;
				};
				content: {
					"application/json": {
						[key: string]: number[];
					};
				};
			};
			/** @description Validation Error */
			422: {
				headers: {
					[name: string]: unknown;
				};
				content: {
					"application/json": components["schemas"]["HTTPValidationError"];
				};
			};
		};
	};
	get_dataset_overview_api_projects__project_id__dataset_get: {
		parameters: {
			query?: never;
			header?: never;
			path: {
				project_id: string;
			};
			cookie?: never;
		};
		requestBody?: never;
		responses: {
			/** @description Successful Response */
			200: {
				headers: {
					[name: string]: unknown;
				};
				content: {
					"application/json": components["schemas"]["DatasetOverview"];
				};
			};
			/** @description Validation Error */
			422: {
				headers: {
					[name: string]: unknown;
				};
				content: {
					"application/json": components["schemas"]["HTTPValidationError"];
				};
			};
		};
	};
	get_project_api_projects__project_id__get: {
		parameters: {
			query?: never;
			header?: never;
			path: {
				project_id: string;
			};
			cookie?: never;
		};
		requestBody?: never;
		responses: {
			/** @description Successful Response */
			200: {
				headers: {
					[name: string]: unknown;
				};
				content: {
					"application/json": components["schemas"]["GetProjectResponse"];
				};
			};
			/** @description Validation Error */
			422: {
				headers: {
					[name: string]: unknown;
				};
				content: {
					"application/json": components["schemas"]["HTTPValidationError"];
				};
			};
		};
	};
}
