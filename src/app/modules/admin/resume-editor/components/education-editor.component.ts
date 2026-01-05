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

import type { Education } from '../../../../models/resume.model';
import { ResumeService } from '../../../../services/resume.service';

@Component({
  selector: 'app-education-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Education</h2>
      <form [formGroup]="educationForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <div formArrayName="education">
          @for (edu of educationArray.controls; track $index; let i = $index) {
            <div
              [formGroupName]="i"
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
            >
              <div class="flex justify-between items-center mb-2">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Education {{ i + 1 }}
                </h3>
                <button
                  type="button"
                  (click)="removeEducation(i)"
                  class="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >Institution*</label
                  >
                  <input
                    type="text"
                    formControlName="institution"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >Degree*</label
                  >
                  <input
                    type="text"
                    formControlName="degree"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >Field</label
                  >
                  <input
                    type="text"
                    formControlName="field"
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
                    placeholder="e.g., Fall 2017"
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
                    placeholder="e.g., Spring 2022"
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
                    >Logo Path</label
                  >
                  <input
                    type="text"
                    formControlName="logo"
                    placeholder="e.g., /fiu.jpg"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <!-- Activities -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Activities</label
                >
                <div formArrayName="activities" class="space-y-2">
                  @for (activity of getActivitiesArray(i).controls; track $index; let j = $index) {
                    <div class="flex gap-2">
                      <input
                        [formControlName]="j"
                        type="text"
                        class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        type="button"
                        (click)="removeActivity(i, j)"
                        class="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
                      >
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  }
                </div>
                <button
                  type="button"
                  (click)="addActivity(i)"
                  class="mt-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <i class="fas fa-plus mr-1"></i> Add Activity
                </button>
              </div>
            </div>
          }
        </div>

        <button
          type="button"
          (click)="addEducation()"
          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          <i class="fas fa-plus mr-2"></i>
          Add Education
        </button>

        <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            [disabled]="!educationForm.valid"
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
export class EducationEditorComponent implements OnInit {
  education = input.required<Education[]>();
  @Output() save = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private resumeService = inject(ResumeService);

  educationForm!: FormGroup;

  get educationArray(): FormArray {
    return this.educationForm.get('education') as FormArray;
  }

  getActivitiesArray(index: number): FormArray {
    return this.educationArray.at(index).get('activities') as FormArray;
  }

  ngOnInit(): void {
    this.educationForm = this.fb.group({
      education: this.fb.array(this.education().map(edu => this.createEducationGroup(edu))),
    });
  }

  createEducationGroup(edu?: Education): FormGroup {
    return this.fb.group({
      institution: [edu?.institution || '', Validators.required],
      degree: [edu?.degree || '', Validators.required],
      field: [edu?.field || ''],
      startDate: [edu?.startDate || ''],
      endDate: [edu?.endDate || ''],
      location: [edu?.location || ''],
      logo: [edu?.logo || ''],
      activities: this.fb.array((edu?.activities || []).map(a => this.fb.control(a))),
    });
  }

  addEducation(): void {
    this.educationArray.push(this.createEducationGroup());
  }

  removeEducation(index: number): void {
    this.educationArray.removeAt(index);
  }

  addActivity(eduIndex: number): void {
    this.getActivitiesArray(eduIndex).push(this.fb.control(''));
  }

  removeActivity(eduIndex: number, actIndex: number): void {
    this.getActivitiesArray(eduIndex).removeAt(actIndex);
  }

  onSubmit(): void {
    if (this.educationForm.valid) {
      this.resumeService
        .updateResumeData({
          education: this.educationForm.value.education,
        })
        .subscribe({
          next: () => {
            this.save.emit();
          },
          error: error => {
            console.error('Failed to save education:', error);
            alert('Failed to save changes. Please try again.');
          },
        });
    }
  }
}
