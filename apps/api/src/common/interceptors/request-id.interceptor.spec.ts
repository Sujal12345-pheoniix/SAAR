import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { RequestIdInterceptor } from './request-id.interceptor';

describe('RequestIdInterceptor', () => {
  let interceptor: RequestIdInterceptor;

  beforeEach(() => {
    interceptor = new RequestIdInterceptor();
  });

  const createMockContext = (headers: Record<string, string | undefined> = {}, existingId?: string) => {
    const req = {
      headers,
      requestId: existingId,
    };
    const res = {
      setHeader: jest.fn(),
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    } as unknown as ExecutionContext;

    const next: CallHandler = {
      handle: () => of(null),
    };

    return { context, next, req, res };
  };

  it('preserves valid incoming X-Request-Id header', async () => {
    const validId = 'client-req-id_123.456';
    const { context, next, req, res } = createMockContext({ 'x-request-id': validId });

    await interceptor.intercept(context, next).toPromise();

    expect(req.requestId).toBe(validId);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', validId);
  });

  it('replaces malformed X-Request-Id containing invalid characters with a new UUID', async () => {
    const maliciousId = '<script>alert(1)</script>';
    const { context, next, req, res } = createMockContext({ 'x-request-id': maliciousId });

    await interceptor.intercept(context, next).toPromise();

    expect(req.requestId).not.toBe(maliciousId);
    expect(req.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', req.requestId);
  });

  it('replaces X-Request-Id exceeding 64 characters with a new UUID', async () => {
    const overlyLongId = 'a'.repeat(65);
    const { context, next, req, res } = createMockContext({ 'x-request-id': overlyLongId });

    await interceptor.intercept(context, next).toPromise();

    expect(req.requestId).not.toBe(overlyLongId);
    expect(req.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', req.requestId);
  });

  it('generates a new UUID when X-Request-Id is absent', async () => {
    const { context, next, req, res } = createMockContext({});

    await interceptor.intercept(context, next).toPromise();

    expect(req.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', req.requestId);
  });
});
