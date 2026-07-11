import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { FlowbiteService } from './flowbite.service';

describe('FlowbiteService', () => {
  let service: FlowbiteService;

  describe('Browser Environment', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
      });
      service = TestBed.inject(FlowbiteService);
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should load flowbite in browser', async () => {
      const callback = vi.fn();

      service.loadFlowbite(callback);

      // Wait for dynamic import to resolve with longer timeout
      await vi.waitFor(
        () => {
          expect(callback).toHaveBeenCalled();
        },
        { timeout: 10000, interval: 50 }
      );

      expect(callback).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should call callback with flowbite object', async () => {
      const callback = vi.fn();

      service.loadFlowbite(callback);

      // Wait for dynamic import to resolve with longer timeout
      await vi.waitFor(
        () => {
          expect(callback).toHaveBeenCalled();
        },
        { timeout: 10000, interval: 50 }
      );

      const callArg = callback.mock.calls[0][0];
      expect(callArg).toBeDefined();
    });
  });

  describe('Server Environment (SSR)', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
      });
      service = TestBed.inject(FlowbiteService);
    });

    it('should be created in SSR', () => {
      expect(service).toBeTruthy();
    });

    it('should not load flowbite in SSR', () => {
      const callback = vi.fn();

      service.loadFlowbite(callback);

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
