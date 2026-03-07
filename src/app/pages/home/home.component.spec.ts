import { Component } from '@angular/core';
import { provideLocationMocks } from '@angular/common/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TavernSceneComponent } from '../../components/tavern-scene/tavern-scene.component';
import { HomeComponent } from './home.component';

@Component({ selector: 'app-tavern-scene', standalone: true, template: '' })
class MockTavernSceneComponent {}

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([]), provideLocationMocks()],
    })
      .overrideComponent(HomeComponent, {
        remove: { imports: [TavernSceneComponent] },
        add: { imports: [MockTavernSceneComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
