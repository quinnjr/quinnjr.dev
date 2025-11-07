import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FlowbiteService {
  private platformId = inject(PLATFORM_ID);

  public loadFlowbite(callback: (flowbite: unknown) => void): void {
    if (isPlatformBrowser(this.platformId)) {
      import('flowbite')
        .then(flowbite => {
          callback(flowbite);
        })
        .catch(() => {
          // Flowbite import error handled
        });
    }
  }
}
