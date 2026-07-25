import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorBody: ErrorResponse = {
      success: false,
      statusCode,
      message: this.extractMessage(exceptionResponse),
      error: exception.name,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log the error
    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${statusCode} - ${JSON.stringify(errorBody.message)}`,
        exception.stack,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${statusCode} - ${JSON.stringify(errorBody.message)}`,
      );
    }

    response.status(statusCode).json(errorBody);
  }

  private extractMessage(exceptionResponse: string | object): string | string[] {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (typeof exceptionResponse === 'object') {
      const response = exceptionResponse as Record<string, any>;

      if (Array.isArray(response.message)) {
        return response.message;
      }

      if (typeof response.message === 'string') {
        return response.message;
      }
    }

    return 'Internal server error';
  }
}
