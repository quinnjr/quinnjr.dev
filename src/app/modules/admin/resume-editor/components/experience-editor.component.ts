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

import type { Experience } from '../../../../models/resume.model';
import { ResumeService } from '../../../../services/resume.service';

@Component({
  selector: 'app-experience-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Work Experience</h2>
      <form [formGroup]="experienceForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <div formArrayName="experiences">
          @for (exp of experiencesArray.controls; track $index; let i = $index) {
            <div
              [formGroupName]="i"
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
            >
              <div class="flex justify-between items-center mb-2">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Experience {{ i + 1 }}
                </h3>
                <button
                  type="button"
                  (click)="removeExperience(i)"
                  class="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >Company*</label
                  >
                  <input
                    type="text"
                    formControlName="company"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >Position*</label
                  >
                  <input
                    type="text"
                    formControlName="position"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >Location</label
                  >
                  <input
                    type="text"
                    formControlName="location"
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

                <div class="flex items-center">
                  <label class="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      formControlName="current"
                      class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                      >Current Position</span
                    >
                  </label>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Description</label
                >
                <textarea
                  formControlName="description"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                ></textarea>
              </div>
            </div>
          }
        </div>

        <button
          type="button"
          (click)="addExperience()"
          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          <i class="fas fa-plus mr-2"></i>
          Add Experience
        </button>

        <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            [disabled]="!experienceForm.valid"
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
export class ExperienceEditorComponent implements OnInit {
  experiences = input.required<Experience[]>();
  @Output() save = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private resumeService = inject(ResumeService);

  experienceForm!: FormGroup;

  get experiencesArray(): FormArray {
    return this.experienceForm.get('experiences') as FormArray;
  }

  ngOnInit(): void {
    this.experienceForm = this.fb.group({
      experiences: this.fb.array(this.experiences().map(exp => this.createExperienceGroup(exp))),
    });
  }

  createExperienceGroup(exp?: Experience): FormGroup {
    return this.fb.group({
      company: [exp?.company || '', Validators.required],
      position: [exp?.position || '', Validators.required],
      location: [exp?.location || ''],
      startDate: [exp?.startDate || ''],
      endDate: [exp?.endDate || ''],
      current: [exp?.current || false],
      description: [exp?.description || ''],
    });
  }

  addExperience(): void {
    this.experiencesArray.push(this.createExperienceGroup());
  }

  removeExperience(index: number): void {
    this.experiencesArray.removeAt(index);
  }

  onSubmit(): void {
    if (this.experienceForm.valid) {
      this.resumeService
        .updateResumeData({
          experience: this.experienceForm.value.experiences,
        })
        .subscribe({
          next: () => {
            this.save.emit();
          },
          error: error => {
            console.error('Failed to save experience:', error);
            alert('Failed to save changes. Please try again.');
          },
        });
    }
  }
}
