import {
  Component,
  OnInit,
  ElementRef,
  Inject,
  PLATFORM_ID,
  ViewChild
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(@Inject(PLATFORM_ID) private readonly $platformId: any) {}

  public ngOnInit() {
    if (isPlatformBrowser(this.$platformId)) {
      const newScript = document.createElement('script');
      newScript.type = 'text/javascript';
      newScript.src = '//cdn.credly.com/assets/utilities/embed.js';
      newScript.async = true;

      document.body.appendChild(newScript);

      // const footer = document.querySelector('footer');
      // const height = footer?.height;
      // const top = footer?.top;
      // const body = document.querySelector('body');
      // const bodyHeight = body?.offsetHeight || 0;

      // if (bodyHeight > top + height) {
      //   footer?.style = `position: absolute; margin-top: 1rem; top: ${
      //     bodyHeight - height
      //     }`;
      // }
    }
  }
}
