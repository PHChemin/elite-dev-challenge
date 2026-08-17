import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = this.resolveMessage(exception, status);

    const rawPath = request.originalUrl ?? request.url;
    const path = rawPath.split('?')[0];

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path,
      message,
    });
  }

  private resolveMessage(
    exception: unknown,
    status: number,
  ): string | string[] {
    if (!(exception instanceof HttpException)) {
      return status === HttpStatus.INTERNAL_SERVER_ERROR
        ? 'Erro interno'
        : 'Erro';
    }

    const body = exception.getResponse();
    if (typeof body === 'string') {
      return body;
    }
    if (body && typeof body === 'object' && 'message' in body) {
      const value = (body as { message: string | string[] }).message;
      return value;
    }
    return exception.message;
  }
}
