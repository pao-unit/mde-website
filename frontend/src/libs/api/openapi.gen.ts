export interface paths {
    "/api/projects": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Projects */
        get: operations["list_projects_api_projects_get"];
        put?: never;
        /** Create Project */
        post: operations["create_project_api_projects_post"];
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
    "/api/projects/{project_id}/runs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create Run */
        post: operations["create_run_api_projects__project_id__runs_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/projects/{project_id}/runs/{run_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Run */
        get: operations["get_run_api_projects__project_id__runs__run_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/projects/{project_id}/runs/{run_id}/result": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Run Result */
        get: operations["get_run_result_api_projects__project_id__runs__run_id__result_get"];
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
        /** AnalysisRun */
        AnalysisRun: {
            /**
             * Id
             * @description The unique identifier for the run
             * @example run_01k6wba7gzecgakd2fr2jkx9z8
             */
            id: string;
            /**
             * Projectid
             * @description Project that owns this run
             * @example project_01k6wba7gzecgakd2fr2jkx9z8
             */
            projectId: string;
            /**
             * Status
             * @description Run lifecycle status
             * @enum {string}
             */
            status: "queued" | "running" | "completed" | "failed";
            /**
             * Error
             * @description Failure message if the run failed
             */
            error?: string | null;
            /**
             * Createdat
             * Format: date-time
             * @description Run creation timestamp
             */
            createdAt: string;
            /**
             * Updatedat
             * Format: date-time
             * @description Run last update timestamp
             */
            updatedAt: string;
            /** @description Analysis settings used for this run */
            settings: components["schemas"]["AnalysisSettings"];
            /** @description Completed analysis result */
            result?: components["schemas"]["Result"] | null;
        };
        /** AnalysisSettings */
        AnalysisSettings: {
            /**
             * Backend
             * @description Analysis implementation used for greedy variable selection
             * @default edmkit
             * @enum {string}
             */
            backend?: "edmkit" | "dimx";
            /**
             * Targets
             * @description Target column names. Predicted jointly; auto-excluded from candidate variables.
             * @example [
             *       "FWD",
             *       "LEFT_RIGHT"
             *     ]
             */
            targets: string[];
            /**
             * Excludecolumns
             * @description Additional columns to exclude from candidate variables
             * @example []
             */
            excludeColumns?: string[];
            /**
             * Maxvariables
             * @description Maximum number of variables to select (greedy forward steps)
             * @example 10
             */
            maxVariables: number;
            /**
             * @description Training (library) point range. Used as the simplex library throughout greedy selection and final scoring.
             * @example {
             *       "end": 6000,
             *       "start": 1
             *     }
             */
            libraryRange: components["schemas"]["PointRange"];
            /**
             * @description Training (prediction) point range. Held-out prediction targets during greedy variable selection.
             * @example {
             *       "end": 8000,
             *       "start": 6001
             *     }
             */
            predictionRange: components["schemas"]["PointRange"];
            /**
             * @description Holdout point range. Final out-of-sample prediction targets used for the best-step plot and holdout rho.
             * @example {
             *       "end": 10000,
             *       "start": 8001
             *     }
             */
            holdoutRange: components["schemas"]["PointRange"];
            /**
             * Seed
             * @description Random seed for reproducibility
             * @default 0
             * @example 0
             */
            seed: number;
            /**
             * Prefilterthreshold
             * @description Pre-filter rho threshold in [0, 1]. Candidate variables whose best univariate embedding rho (across the (E, tau) grid on the training library + prediction rows) is below this value are dropped before greedy selection. 0 disables the pre-filter.
             * @default 0
             * @example 0
             * @example 0.1
             */
            prefilterThreshold: number;
        };
        /** BestStep */
        BestStep: {
            /**
             * Stepindex
             * @description 1-indexed greedy step that achieved the highest prediction rho
             * @example 4
             */
            stepIndex: number;
            /**
             * Rho
             * @description Mean holdout rho at the selected best step
             * @example 0.74
             */
            rho: number;
            /**
             * Rhoprediction
             * @description Mean prediction rho used to choose the best step
             * @example 0.78
             */
            rhoPrediction: number;
            /**
             * Rhoholdout
             * @description Mean holdout rho at the selected best step
             * @example 0.74
             */
            rhoHoldout: number;
            /**
             * Plots
             * @description Per-target observed-vs-predicted series on the holdout points at the best step
             */
            plots: components["schemas"]["TargetPlot"][];
        };
        /** Body_create_project_api_projects_post */
        Body_create_project_api_projects_post: {
            /** File */
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
             * Pointcount
             * @description Total number of points
             * @example 600
             */
            pointCount: number;
            /**
             * Columns
             * @description Per-column summaries
             */
            columns: components["schemas"]["ColumnSummary"][];
        };
        /** FoldSummary */
        FoldSummary: {
            /** Librarysize */
            librarySize: number;
            /** Predictionsize */
            predictionSize: number;
            /** Holdoutsize */
            holdoutSize: number;
        };
        /** HTTPValidationError */
        HTTPValidationError: {
            /** Detail */
            detail?: components["schemas"]["ValidationError"][];
        };
        /** PointRange */
        PointRange: {
            /**
             * Start
             * @description Inclusive 1-indexed start point
             * @example 1
             */
            start: number;
            /**
             * End
             * @description Inclusive 1-indexed end point
             * @example 300
             */
            end: number;
        };
        /** PrefilterSummary */
        PrefilterSummary: {
            /**
             * Threshold
             * @description Threshold used (matches AnalysisSettings.prefilterThreshold)
             * @example 0.1
             */
            threshold: number;
            /**
             * Total
             * @description Number of candidate variables before pre-filtering
             * @example 24
             */
            total: number;
            /**
             * Kept
             * @description Number of variables retained after pre-filtering
             * @example 13
             */
            kept: number;
            /**
             * Droppedcolumns
             * @description Names of candidate variables dropped by the pre-filter
             */
            droppedColumns?: string[];
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
        /** ProjectDetail */
        ProjectDetail: {
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
            /** @description Most recently created analysis run */
            latestRun?: components["schemas"]["AnalysisRun"] | null;
        };
        /** Result */
        Result: {
            /**
             * Steps
             * @description Selected variables in greedy order. Each entry is one forward step.
             */
            steps: components["schemas"]["SelectionStep"][];
            /** @description Information about the step with the best prediction rho (None if no variables were selected) */
            bestStep?: components["schemas"]["BestStep"] | null;
            /** @description Effective fold sizes used by the run */
            fold: components["schemas"]["FoldSummary"];
            /** @description Pre-filter outcome. None when prefilterThreshold is 0 (filter skipped). */
            prefilter?: components["schemas"]["PrefilterSummary"] | null;
        };
        /** SelectionStep */
        SelectionStep: {
            /**
             * Variable
             * @description Variable added at this step
             * @example TS12
             */
            variable: string;
            /**
             * Rhoprediction
             * @description Mean Pearson rho on the Training (prediction) range (drives greedy selection)
             * @example 0.78
             */
            rhoPrediction: number;
            /**
             * Rhoholdout
             * @description Mean Pearson rho on the Holdout range (true generalization)
             * @example 0.74
             */
            rhoHoldout: number;
        };
        /** TargetPlot */
        TargetPlot: {
            /**
             * Name
             * @description Target column name
             * @example FWD
             */
            name: string;
            /**
             * Observed
             * @description Ground-truth target values over the holdout points
             */
            observed: number[];
            /**
             * Predicted
             * @description Simplex-projection predictions over the holdout points
             */
            predicted: number[];
        };
        /** ValidationError */
        ValidationError: {
            /** Location */
            loc: (string | number)[];
            /** Message */
            msg: string;
            /** Error Type */
            type: string;
            /** Input */
            input?: unknown;
            /** Context */
            ctx?: Record<string, never>;
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
    list_projects_api_projects_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
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
                    "application/json": components["schemas"]["Project"][];
                };
            };
        };
    };
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
            201: {
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
                    "application/json": components["schemas"]["ProjectDetail"];
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
                        [key: string]: (number | null)[];
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
    create_run_api_projects__project_id__runs_post: {
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
                "application/json": components["schemas"]["AnalysisSettings"];
            };
        };
        responses: {
            /** @description Successful Response */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AnalysisRun"];
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
    get_run_api_projects__project_id__runs__run_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                project_id: string;
                run_id: string;
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
                    "application/json": components["schemas"]["AnalysisRun"];
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
    get_run_result_api_projects__project_id__runs__run_id__result_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                project_id: string;
                run_id: string;
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
                    "application/json": components["schemas"]["Result"];
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
