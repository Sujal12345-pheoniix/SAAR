import { ThrottlerStorageRedisService } from './throttler-storage-redis.service';
import type Redis from 'ioredis';

describe('ThrottlerStorageRedisService', () => {
  let service: ThrottlerStorageRedisService;
  let redisMock: {
    get: jest.Mock;
    pttl: jest.Mock;
    multi: jest.Mock;
    pexpire: jest.Mock;
    set: jest.Mock;
    quit: jest.Mock;
    disconnect: jest.Mock;
  };

  beforeEach(() => {
    redisMock = {
      get: jest.fn().mockResolvedValue(null),
      pttl: jest.fn().mockResolvedValue(30000),
      multi: jest.fn(),
      pexpire: jest.fn().mockResolvedValue(1),
      set: jest.fn().mockResolvedValue('OK'),
      quit: jest.fn().mockResolvedValue('OK'),
      disconnect: jest.fn(),
    };

    service = new ThrottlerStorageRedisService(redisMock as unknown as Redis);
  });

  it('increments hits and sets ttl when key is new', async () => {
    const multiChain = {
      incr: jest.fn().mockReturnThis(),
      pttl: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([[null, 1], [null, -1]]),
    };
    redisMock.multi.mockReturnValue(multiChain);

    const result = await service.increment('ip-1', 60000, 100, 60000, 'default');

    expect(result).toEqual({
      totalHits: 1,
      timeToExpire: 60,
      isBlocked: false,
      timeToBlockExpire: 0,
    });
    expect(redisMock.pexpire).toHaveBeenCalledWith('throttle:default:ip-1', 60000);
  });

  it('blocks key when limit is exceeded', async () => {
    const multiChain = {
      incr: jest.fn().mockReturnThis(),
      pttl: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([[null, 101], [null, 45000]]),
    };
    redisMock.multi.mockReturnValue(multiChain);

    const result = await service.increment('ip-1', 60000, 100, 60000, 'default');

    expect(result).toEqual({
      totalHits: 101,
      timeToExpire: 45,
      isBlocked: true,
      timeToBlockExpire: 60,
    });
    expect(redisMock.set).toHaveBeenCalledWith(
      'throttle:block:default:ip-1',
      '1',
      'PX',
      60000,
    );
  });

  it('immediately returns isBlocked true if block key exists', async () => {
    redisMock.get.mockResolvedValueOnce('1');
    redisMock.pttl.mockResolvedValueOnce(35000);

    const result = await service.increment('ip-1', 60000, 100, 60000, 'default');

    expect(result.isBlocked).toBe(true);
    expect(result.totalHits).toBe(101);
    expect(result.timeToBlockExpire).toBe(35);
    expect(redisMock.multi).not.toHaveBeenCalled();
  });

  it('gracefully falls back when Redis throws an error', async () => {
    redisMock.get.mockRejectedValueOnce(new Error('Redis connection lost'));

    const result = await service.increment('ip-1', 60000, 100, 60000, 'default');

    expect(result).toEqual({
      totalHits: 1,
      timeToExpire: 60,
      isBlocked: false,
      timeToBlockExpire: 0,
    });
  });

  it('closes Redis on module destroy', async () => {
    await service.onModuleDestroy();
    expect(redisMock.quit).toHaveBeenCalled();
  });
});
