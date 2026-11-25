// Generated from openapi.json by `pnpm --filter @portflow/contracts generate`.
// Do not edit: change the API, write the contract, then generate again.

export interface paths {
    "/api/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Health of the service and of its database. */
        get: operations["get_health"];
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
        /** @enum {string} */
        ComponentStatus: "up" | "down";
        HealthResponse: {
            database: components["schemas"]["ComponentStatus"];
            /** @description `up` when every component is up. */
            status: components["schemas"]["ComponentStatus"];
        };
        /** @description The body of every error response of the API. */
        Problem: {
            code: components["schemas"]["ProblemCode"];
            /** @description An explanation in English for the developer, never shown to the user. */
            detail: string;
            /**
             * Format: int32
             * @description The HTTP status code of the response.
             */
            status: number;
            /** @description The reason phrase of the status code. */
            title: string;
            /** @description Always `about:blank`: `code` identifies the error. */
            type: string;
        };
        /**
         * @description The stable identifier of an error. The web app maps each value to a label:
         *     a value is never renamed or removed without the two issues of a contract change.
         * @enum {string}
         */
        ProblemCode: "NOT_FOUND" | "METHOD_NOT_ALLOWED" | "INVALID_REQUEST" | "DATABASE_UNAVAILABLE" | "INTERNAL_ERROR";
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    get_health: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The service and its database are up */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthResponse"];
                };
            };
            /** @description Internal error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "INTERNAL_ERROR",
                     *       "detail": "The server could not handle the request",
                     *       "status": 500,
                     *       "title": "Internal Server Error",
                     *       "type": "about:blank"
                     *     }
                     */
                    "application/problem+json": components["schemas"]["Problem"];
                };
            };
            /** @description The database does not answer */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "DATABASE_UNAVAILABLE",
                     *       "detail": "The database does not answer",
                     *       "status": 503,
                     *       "title": "Service Unavailable",
                     *       "type": "about:blank"
                     *     }
                     */
                    "application/problem+json": components["schemas"]["Problem"];
                };
            };
        };
    };
}
