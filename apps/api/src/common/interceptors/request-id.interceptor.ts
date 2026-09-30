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

const REQUEST_ID_REGEX = /^[A-Za-z0-9._-]{1,64}$/;

function isValidRequestId(id: unknown): id is string {
  return typeof id === 'string' && REQUEST_ID_REGEX.test(id);
}

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<RequestWithId>();
    const res = http.getResponse<Response>();

    // Use existing validated requestId set by middleware, or validate header, or generate new UUID
    const requestId =
      isValidRequestId(req.requestId)
        ? req.requestId
        : isValidRequestId(req.headers['x-request-id'])
        ? req.headers['x-request-id']
        : uuidv4();

    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    return next.handle();
  }
}
