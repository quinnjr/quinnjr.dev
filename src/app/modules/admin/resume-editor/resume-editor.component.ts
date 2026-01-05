import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, type OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import type { Observable } from 'rxjs';

import type { ResumeData } from '../../../models/resume.model';
import { ResumeService } from '../../../services/resume.service';

import { ContactEditorComponent } from './components/contact-editor.component';
import { EducationEditorComponent } from './components/education-editor.component';
import { ExperienceEditorComponent } from './components/experience-editor.component';
import { ProfileEditorComponent } from './components/profile-editor.component';
import { ProjectsEditorComponent } from './components/projects-editor.component';
import { SkillsEditorComponent } from './components/skills-editor.component';

@Component({
  selector: 'app-resume-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ContactEditorComponent,
    ProfileEditorComponent,
    ExperienceEditorComponent,
    EducationEditorComponent,
    ProjectsEditorComponent,
    SkillsEditorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './resume-editor.component.html',
  styleUrl: './resume-editor.component.scss',
})
export class ResumeEditorComponent implements OnInit {
  private resumeService = inject(ResumeService);
  resumeData$!: Observable<ResumeData>;
  activeSection = 'contact';

  ngOnInit(): void {
    this.resumeData$ = this.resumeService.getResumeData();
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  saveSuccess(): void {
    // Show success message
    alert('Resume updated successfully!');
  }
}
