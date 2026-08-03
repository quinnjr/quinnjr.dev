import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch((err: unknown) => {
  console.error('Failed to bootstrap application:', err);

  const root = document.querySelector('app-root');
  if (!root) {
    return;
  }

  // Built node-by-node rather than via innerHTML: the error string is
  // attacker-influenceable in principle and must never be parsed as markup.
  const panel = document.createElement('div');
  panel.setAttribute('style', 'padding: 20px; color: red; font-family: monospace;');

  const heading = document.createElement('h1');
  heading.textContent = 'Application Failed to Load';

  const detail = document.createElement('pre');
  detail.textContent = err instanceof Error ? err.message : String(err);

  const hint = document.createElement('p');
  hint.textContent = 'Check the browser console for more details.';

  panel.append(heading, detail, hint);
  root.replaceChildren(panel);
});
