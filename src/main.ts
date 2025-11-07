import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch((err: Error) => {
  console.error('Failed to bootstrap application:', err);
  // Display error to user
  const root = document.querySelector('app-root');
  if (root) {
    const errorMessage = err.message ?? String(err);
    root.innerHTML = `
      <div style="padding: 20px; color: red; font-family: monospace;">
        <h1>Application Failed to Load</h1>
        <pre>${errorMessage}</pre>
        <p>Check the browser console for more details.</p>
      </div>
    `;
  }
});
