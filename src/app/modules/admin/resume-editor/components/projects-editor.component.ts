import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  type OnInit,
  Output,
  input,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  type FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import type { Project } from '../../../../models/resume.model';
import { ResumeService } from '../../../../services/resume.service';

@Component({
  selector: 'app-projects-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Projects</h2>
      <form [formGroup]="projectsForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <div formArrayName="projects">
          @for (project of projectsArray.controls; track $index; let i = $index) {
            <div
              [formGroupName]="i"
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
            >
              <div class="flex justify-between items-center mb-2">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Project {{ i + 1 }}
                </h3>
                <button
                  type="button"
                  (click)="removeProject(i)"
                  class="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >Project Name*</label
                  >
                  <input
                    type="text"
                    formControlName="name"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >Date</label
                  >
                  <input
                    type="text"
                    formControlName="date"
                    placeholder="e.g., Jan 2020"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >Start Date</label
                  >
                  <input
                    type="text"
                    formControlName="startDate"
                    placeholder="e.g., May 2021"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >End Date</label
                  >
                  <input
                    type="text"
                    formControlName="endDate"
                    placeholder="e.g., Nov 2024"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >Project URL</label
                  >
                  <input
                    type="url"
                    formControlName="url"
                    placeholder="https://example.com/project"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Description</label
                >
                <textarea
                  formControlName="description"
                  rows="2"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                ></textarea>
              </div>
            </div>
          }
        </div>

        <button
          type="button"
          (click)="addProject()"
          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          <i class="fas fa-plus mr-2"></i>
          Add Project
        </button>

        <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            [disabled]="!projectsForm.valid"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <i class="fas fa-save mr-2"></i>
            Save Changes
          </button>
        </div>
      </form>
    </div>
  `,
})
export class ProjectsEditorComponent implements OnInit {
  projects = input.required<Project[]>();
  @Output() save = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private resumeService = inject(ResumeService);

  projectsForm!: FormGroup;

  get projectsArray(): FormArray {
    return this.projectsForm.get('projects') as FormArray;
  }

  ngOnInit(): void {
    this.projectsForm = this.fb.group({
      projects: this.fb.array(this.projects().map(proj => this.createProjectGroup(proj))),
    });
  }

  createProjectGroup(proj?: Project): FormGroup {
    return this.fb.group({
      name: [proj?.name || '', Validators.required],
      date: [proj?.date || ''],
      startDate: [proj?.startDate || ''],
      endDate: [proj?.endDate || ''],
      description: [proj?.description || ''],
      url: [proj?.url || ''],
    });
  }

  addProject(): void {
    this.projectsArray.push(this.createProjectGroup());
  }

  removeProject(index: number): void {
    this.projectsArray.removeAt(index);
  }

  onSubmit(): void {
    if (this.projectsForm.valid) {
      this.resumeService
        .updateResumeData({
          projects: this.projectsForm.value.projects,
        })
        .subscribe({
          next: () => {
            this.save.emit();
          },
          error: error => {
            console.error('Failed to save projects:', error);
            alert('Failed to save changes. Please try again.');
          },
        });
    }
  }
}
