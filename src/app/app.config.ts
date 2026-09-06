import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling }                   from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi }              from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'top' })),
    // XHR backend (default) — required for the Angular dev proxy to intercept /api/* calls.
    // withFetch() was removed because Fetch API bypasses the dev proxy,
    // causing all /api/analyze, /api/content, /api/market-intelligence requests
    // to fail with status:0 / "Http failure response: 0 undefined".
    provideHttpClient(withInterceptorsFromDi())
  ]
};
