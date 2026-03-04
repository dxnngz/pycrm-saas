import { jest } from '@jest/globals';
const connect = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
