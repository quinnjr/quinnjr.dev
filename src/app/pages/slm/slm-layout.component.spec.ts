import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ApolloTestingModule } from 'apollo-angular/testing';

import { SeoService } from '../../services/seo.service';

import { SlmLayoutComponent } from './slm-layout.component';

describe('SlmLayoutComponent', () => {
  function configure(): void {
    TestBed.configureTestingModule({
      imports: [ApolloTestingModule],
      providers: [
        provideRouter([{ path: '**', component: SlmLayoutComponent }]),
        provideHttpClient(),
      ],
    });
  }

  async function layoutAt(url: string): Promise<SlmLayoutComponent> {
    configure();
    await TestBed.inject(Router).navigateByUrl(url);
    const fixture = TestBed.createComponent(SlmLayoutComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('first chapter has no prev and Definitions as next', async () => {
    const c = await layoutAt('/slm/introduction');
    expect(c.prev()).toBeNull();
    expect(c.next()?.title).toBe('Definitions');
  });

  it('second chapter links to both neighbours', async () => {
    const c = await layoutAt('/slm/definitions');
    expect(c.prev()?.title).toBe('Introduction');
    expect(c.next()?.title).toBe('Evidence');
  });

  it('third chapter links to both neighbours', async () => {
    const c = await layoutAt('/slm/evidence');
    expect(c.prev()?.title).toBe('Definitions');
    expect(c.next()?.title).toBe('Costs');
  });

  it('fourth chapter links to both neighbours', async () => {
    const c = await layoutAt('/slm/costs');
    expect(c.prev()?.title).toBe('Evidence');
    expect(c.next()?.title).toBe('Backlash');
  });

  it('fifth chapter links to both neighbours', async () => {
    const c = await layoutAt('/slm/backlash');
    expect(c.prev()?.title).toBe('Costs');
    expect(c.next()?.title).toBe('Overkill');
  });

  it('last chapter has no next', async () => {
    const c = await layoutAt('/slm/overkill');
    expect(c.prev()?.title).toBe('Backlash');
    expect(c.next()).toBeNull();
  });

  // Regression: bare /slm used to fall back to CHAPTERS[0], labelling the page
  // "Introduction" with canonical /slm/introduction before the redirect ran.
  it('applies no chapter SEO at bare /slm', async () => {
    configure();
    const apply = vi.spyOn(TestBed.inject(SeoService), 'apply');
    await TestBed.inject(Router).navigateByUrl('/slm');
    const fixture = TestBed.createComponent(SlmLayoutComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.currentChapter()).toBeNull();
    expect(apply).not.toHaveBeenCalled();
  });
});
