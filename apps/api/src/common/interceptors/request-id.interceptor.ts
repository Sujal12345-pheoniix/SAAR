import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import type { Request, Response } from 'express';

export type RequestWithId = Request & { requestId: string };

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<RequestWithId>();
    const res = http.getResponse<Response>();

    // Use existing requestId set by middleware, or generate a new one
    const requestId =
      (req.requestId as string | undefined) ??
      (req.headers['x-request-id'] as string | undefined) ??
      uuidv4();

    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    return next.handle();
  }
}
