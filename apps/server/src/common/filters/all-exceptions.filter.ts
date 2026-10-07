import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import type { Request, Response } from 'express';

type AuthenticatedRequest = Request & {
  session?: UserSession;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<AuthenticatedRequest>();

    const userId = request.session?.user?.id ?? 'anonymous';
    const requestInfo = `${request.method} ${request.url}, userId=${userId}`;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(`HTTP ${status}: ${requestInfo}`, exception.stack);
      } else if (status >= HttpStatus.BAD_REQUEST) {
        this.logger.warn(`HTTP ${status}: ${requestInfo}`);
      }

      response.status(status).json(
        typeof exceptionResponse === 'string'
          ? {
              statusCode: status,
              message: exceptionResponse,
            }
          : exceptionResponse,
      );

      return;
    }

    const stack = exception instanceof Error ? exception.stack : undefined;

    this.logger.error(`Unhandled HTTP 500: ${requestInfo}`, stack);

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error.',
    });
  }
}
