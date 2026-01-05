import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ResumeService } from '../../../services/resume.service';

import { ResumeEditorComponent } from './resume-editor.component';

describe('ResumeEditorComponent', () => {
  let component: ResumeEditorComponent;
  let fixture: ComponentFixture<ResumeEditorComponent>;
  let mockResumeService: jasmine.SpyObj<ResumeService>;

  beforeEach(async () => {
    mockResumeService = jasmine.createSpyObj('ResumeService', ['getResumeData']);
    mockResumeService.getResumeData.and.returnValue(
      of({
        contact: {
          name: 'Test User',
          email: 'test@example.com',
        },
        profile: {
          summary: ['Test summary'],
        },
        skills: [],
        education: [],
        experience: [],
        certifications: [],
        professionalMemberships: [],
        projects: [],
      })
    );

    await TestBed.configureTestingModule({
      imports: [ResumeEditorComponent],
      providers: [{ provide: ResumeService, useValue: mockResumeService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ResumeEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load resume data on init', () => {
    expect(mockResumeService.getResumeData).toHaveBeenCalled();
  });

  it('should set active section', () => {
    component.setActiveSection('experience');
    expect(component.activeSection).toBe('experience');
  });

  it('should default to contact section', () => {
    expect(component.activeSection).toBe('contact');
  });
});
