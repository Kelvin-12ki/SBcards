import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Global exception filter that catches ALL exceptions (not just HttpException).
 * Logs errors to both console and a file for debugging.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorName = 'Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const resp = exception.getResponse();
      if (typeof resp === 'string') {
        message = resp;
      } else if (typeof resp === 'object' && resp !== null) {
        message = (resp as any).message || message;
        errorName = (resp as any).error || exception.name;
      }
      errorName = exception.name;
    } else if (exception instanceof Error) {
      message = exception.message;
      errorName = exception.name;
    }

    const errorBody = {
      statusCode,
      message,
      error: errorName,
      timestamp: new Date().toISOString(),
      path: request?.url || 'unknown',
    };

    // Log to console
    const logMsg = `${request?.method || 'UNKNOWN'} ${request?.url || 'unknown'} - ${statusCode} - ${message}`;
    if (statusCode >= 500) {
      this.logger.error(logMsg, exception instanceof Error ? exception.stack : undefined);
    } else {
      this.logger.warn(logMsg);
    }

    // Also log to a file for easy debugging
    try {
      const logDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
      const logFile = path.join(logDir, 'exceptions.log');
      const entry = `[${new Date().toISOString()}] ${request?.method || 'UNKNOWN'} ${request?.url || 'unknown'} - ${statusCode}\n${JSON.stringify(errorBody, null, 2)}\n${exception instanceof Error ? exception.stack || '' : ''}\n---\n`;
      fs.appendFileSync(logFile, entry);
    } catch { /* ignore file write errors */ }

    response.status(statusCode).json(errorBody);
  }
}
