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
import { FormArray, FormBuilder, type FormGroup, ReactiveFormsModule } from '@angular/forms';

import type { ResumeData } from '../../../../models/resume.model';
import { ResumeService } from '../../../../services/resume.service';

@Component({
  selector: 'app-profile-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Profile Summary</h2>
      <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <!-- Summary Paragraphs -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Summary Paragraphs
          </label>
          <div formArrayName="summary" class="space-y-3">
            @for (control of summaryControls.controls; track $index) {
              <div class="flex gap-2">
                <textarea
                  [formControlName]="$index"
                  rows="3"
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                ></textarea>
                <button
                  type="button"
                  (click)="removeSummary($index)"
                  class="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-md transition-colors"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            }
          </div>
          <button
            type="button"
            (click)="addSummary()"
            class="mt-2 px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            <i class="fas fa-plus mr-1"></i> Add Paragraph
          </button>
        </div>

        <!-- Bar Admission -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bar Admissions
          </label>
          <div formArrayName="barAdmission" class="space-y-2">
            @for (control of barAdmissionControls.controls; track $index) {
              <div class="flex gap-2">
                <input
                  [formControlName]="$index"
                  type="text"
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="button"
                  (click)="removeBarAdmission($index)"
                  class="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-md transition-colors"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            }
          </div>
          <button
            type="button"
            (click)="addBarAdmission()"
            class="mt-2 px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            <i class="fas fa-plus mr-1"></i> Add Bar Admission
          </button>
        </div>

        <!-- Interests -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Special Interests
          </label>
          <div formArrayName="interests" class="space-y-2">
            @for (control of interestsControls.controls; track $index) {
              <div class="flex gap-2">
                <input
                  [formControlName]="$index"
                  type="text"
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="button"
                  (click)="removeInterest($index)"
                  class="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-md transition-colors"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            }
          </div>
          <button
            type="button"
            (click)="addInterest()"
            class="mt-2 px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            <i class="fas fa-plus mr-1"></i> Add Interest
          </button>
        </div>

        <div class="flex justify-end">
          <button
            type="submit"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <i class="fas fa-save mr-2"></i>
            Save Changes
          </button>
        </div>
      </form>
    </div>
  `,
})
export class ProfileEditorComponent implements OnInit {
  profile = input.required<ResumeData['profile']>();
  @Output() save = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private resumeService = inject(ResumeService);

  profileForm!: FormGroup;

  get summaryControls() {
    return this.profileForm.get('summary') as FormArray;
  }

  get barAdmissionControls() {
    return this.profileForm.get('barAdmission') as FormArray;
  }

  get interestsControls() {
    return this.profileForm.get('interests') as FormArray;
  }

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      summary: this.fb.array(this.profile().summary.map(s => this.fb.control(s))),
      barAdmission: this.fb.array((this.profile().barAdmission || []).map(b => this.fb.control(b))),
      interests: this.fb.array((this.profile().interests || []).map(i => this.fb.control(i))),
    });
  }

  addSummary(): void {
    this.summaryControls.push(this.fb.control(''));
  }

  removeSummary(index: number): void {
    this.summaryControls.removeAt(index);
  }

  addBarAdmission(): void {
    this.barAdmissionControls.push(this.fb.control(''));
  }

  removeBarAdmission(index: number): void {
    this.barAdmissionControls.removeAt(index);
  }

  addInterest(): void {
    this.interestsControls.push(this.fb.control(''));
  }

  removeInterest(index: number): void {
    this.interestsControls.removeAt(index);
  }

  onSubmit(): void {
    const formValue = this.profileForm.value;
    this.resumeService
      .updateResumeData({
        profile: {
          summary: formValue.summary.filter((s: string) => s.trim()),
          barAdmission: formValue.barAdmission.filter((b: string) => b.trim()),
          interests: formValue.interests.filter((i: string) => i.trim()),
        },
      })
      .subscribe({
        next: () => {
          this.save.emit();
        },
        error: error => {
          console.error('Failed to save profile:', error);
          alert('Failed to save changes. Please try again.');
        },
      });
  }
}
