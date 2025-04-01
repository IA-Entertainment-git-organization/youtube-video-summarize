export enum ErrorType {
  INVALID_URL = 'INVALID_URL',
  VIDEO_TOO_LONG = 'VIDEO_TOO_LONG',
  NO_TRANSCRIPT = 'NO_TRANSCRIPT',
  API_ERROR = 'API_ERROR',
  ACCESS_RESTRICTED = 'ACCESS_RESTRICTED',
  REGION_BLOCKED = 'REGION_BLOCKED',
  SUMMARIZATION_ERROR = 'SUMMARIZATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface AppError extends Error {
  type: ErrorType;
}

export function createError(message: string, type: ErrorType): AppError {
  const error = new Error(message) as AppError;
  error.type = type;
  return error;
}

export function formatErrorResponse(error: any): string {
  if ((error as AppError).type) {
    const appError = error as AppError;
    
    switch (appError.type) {
      case ErrorType.INVALID_URL:
        return 'Invalid YouTube URL provided. Please check the URL and try again.';
      
      case ErrorType.VIDEO_TOO_LONG:
        return 'The video is too long to process. Please try a shorter video.';
      
      case ErrorType.NO_TRANSCRIPT:
        return 'No transcript is available for this video. This could be because:\n' +
               '- The video does not have captions\n' +
               '- The captions are disabled by the creator\n' +
               '- The captions are in a format we cannot process\n\n' +
               'Try a different video with available captions.';
      
      case ErrorType.API_ERROR:
        return `An error occurred while communicating with YouTube: ${appError.message}\n\n` +
               'This could be a temporary issue. Please try again later.';
      
      case ErrorType.ACCESS_RESTRICTED:
        return 'This video cannot be accessed due to restrictions. This could be because:\n' +
               '- The video is age-restricted\n' +
               '- The video is private\n' +
               '- The video is region-blocked\n' +
               '- The video has copyright restrictions\n\n' +
               'Please try a different video without such restrictions.';
      
      case ErrorType.REGION_BLOCKED:
        return 'This video is not available in your region due to geographical restrictions imposed by the content owner.';
      
      case ErrorType.SUMMARIZATION_ERROR:
        return `An error occurred while summarizing the video: ${appError.message}\n\n` +
               'Please try again or try a different video.';
      
      default:
        return `An unexpected error occurred: ${appError.message}`;
    }
  }
  
  return `An unexpected error occurred: ${error.message || 'Unknown error'}`;
}