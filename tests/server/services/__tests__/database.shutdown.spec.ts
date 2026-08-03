import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { DatabaseService } from '../../../../src/server/services/database.service';

// Mock PrismaClient before importing DatabaseService
vi.mock('../../../../src/generated/prisma/client', () => ({
  PrismaClient: vi.fn(),
}));

/** Grab the listener the service registered for a signal, without raising it
 * for real (an actual SIGTERM would kill the vitest worker). */
function signalListeners(signal: 'SIGTERM' | 'SIGINT'): Array<() => void> {
  return process.listeners(signal) as Array<() => void>;
}

describe('DatabaseService shutdown hooks', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let before: Record<'SIGTERM' | 'SIGINT', number>;

  beforeEach(() => {
    before = {
      SIGTERM: signalListeners('SIGTERM').length,
      SIGINT: signalListeners('SIGINT').length,
    };
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    vi.restoreAllMocks();
  });

  function build(disconnect: () => Promise<void>): () => void {
    const service = new DatabaseService();
    (service as unknown as { client: unknown }).client = { $disconnect: disconnect };
    const listeners = signalListeners('SIGTERM');
    return listeners[listeners.length - 1];
  }

  it('registers on SIGTERM and SIGINT rather than beforeExit', () => {
    new DatabaseService();
    expect(signalListeners('SIGTERM').length).toBe(before.SIGTERM + 1);
    expect(signalListeners('SIGINT').length).toBe(before.SIGINT + 1);
  });

  it('awaits the disconnect before exiting', async () => {
    let resolved = false;
    const disconnect = vi.fn(async () => {
      await Promise.resolve();
      resolved = true;
    });
    const onSigterm = build(disconnect);

    onSigterm();
    await vi.waitFor(() => expect(exitSpy).toHaveBeenCalled());

    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(resolved).toBe(true);
  });

  it('logs a failed disconnect instead of swallowing it, and still exits', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const onSigterm = build(() => Promise.reject(new Error('pool is wedged')));

    onSigterm();
    await vi.waitFor(() => expect(exitSpy).toHaveBeenCalled());

    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to disconnect'),
      expect.any(Error)
    );
  });
});
