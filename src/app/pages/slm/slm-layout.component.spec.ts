import { provideHttpClient, withXhr } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ApolloTestingModule } from 'apollo-angular/testing';

import { SlmLayoutComponent } from './slm-layout.component';

describe('SlmLayoutComponent', () => {
  async function layoutAt(url: string): Promise<SlmLayoutComponent> {
    TestBed.configureTestingModule({
      imports: [ApolloTestingModule],
      providers: [
        provideRouter([{ path: '**', component: SlmLayoutComponent }]),
        provideHttpClient(withXhr()),
      ],
    });
    await TestBed.inject(Router).navigateByUrl(url);
    const fixture = TestBed.createComponent(SlmLayoutComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('first chapter has no prev and Principles as next', async () => {
    const c = await layoutAt('/slm/preamble');
    expect(c.prev()).toBeNull();
    expect(c.next()?.title).toBe('Principles');
  });

  it('middle chapter links to both neighbours', async () => {
    const c = await layoutAt('/slm/principles');
    expect(c.prev()?.title).toBe('Preamble');
    expect(c.next()?.title).toBe('Practice');
  });

  it('last chapter has no next', async () => {
    const c = await layoutAt('/slm/practice');
    expect(c.prev()?.title).toBe('Principles');
    expect(c.next()).toBeNull();
  });
});
