import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FlowbiteService {

  private platformId = inject(PLATFORM_ID);

  constructor() {}

  public loadFlowbite(callback: (flowbite: any) => void): void {
    if (isPlatformBrowser(this.platformId)) {
      import('flowbite').then(flowbite => {
        callback(flowbite);
      });
    }
  }
}
