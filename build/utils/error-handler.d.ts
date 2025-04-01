export declare enum ErrorType {
    INVALID_URL = "INVALID_URL",
    VIDEO_TOO_LONG = "VIDEO_TOO_LONG",
    NO_TRANSCRIPT = "NO_TRANSCRIPT",
    API_ERROR = "API_ERROR",
    ACCESS_RESTRICTED = "ACCESS_RESTRICTED",
    REGION_BLOCKED = "REGION_BLOCKED",
    SUMMARIZATION_ERROR = "SUMMARIZATION_ERROR",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
export interface AppError extends Error {
    type: ErrorType;
}
export declare function createError(message: string, type: ErrorType): AppError;
export declare function formatErrorResponse(error: any): string;
