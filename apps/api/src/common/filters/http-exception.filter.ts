import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import type { FieldErrors } from '../validation/field-errors';

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

    const rawPath = request.originalUrl ?? request.url;
    const path = rawPath.split('?')[0];

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path,
      message: this.resolveMessage(exception),
      fieldErrors: this.resolveFieldErrors(exception),
    });
  }

  private resolveMessage(exception: unknown): string | string[] {
    if (!(exception instanceof HttpException)) {
      return 'Erro interno';
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

  private resolveFieldErrors(exception: unknown): FieldErrors {
    if (!(exception instanceof HttpException)) {
      return {};
    }

    const body = exception.getResponse();
    if (!body || typeof body !== 'object' || !('fieldErrors' in body)) {
      return {};
    }

    const value = body.fieldErrors;
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return value as FieldErrors;
  }
}
