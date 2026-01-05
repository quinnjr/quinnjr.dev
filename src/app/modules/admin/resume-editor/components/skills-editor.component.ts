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

import type { Skill } from '../../../../models/resume.model';
import { ResumeService } from '../../../../services/resume.service';

@Component({
  selector: 'app-skills-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Skills</h2>
      <form [formGroup]="skillsForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <div formArrayName="skills" class="space-y-4">
          @for (skill of skillsArray.controls; track $index; let i = $index) {
            <div
              [formGroupName]="i"
              class="flex gap-3 items-start border border-gray-200 dark:border-gray-700 rounded-lg p-3"
            >
              <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >Skill Name*</label
                  >
                  <input
                    type="text"
                    formControlName="name"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >Category</label
                  >
                  <input
                    type="text"
                    formControlName="category"
                    placeholder="e.g., Programming, Tools, Languages"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="button"
                (click)="removeSkill(i)"
                class="mt-7 px-2 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
              >
                <i class="fas fa-trash"></i>
              </button>
            </div>
          }
        </div>

        <button
          type="button"
          (click)="addSkill()"
          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          <i class="fas fa-plus mr-2"></i>
          Add Skill
        </button>

        <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            [disabled]="!skillsForm.valid"
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
export class SkillsEditorComponent implements OnInit {
  skills = input.required<Skill[]>();
  @Output() save = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private resumeService = inject(ResumeService);

  skillsForm!: FormGroup;

  get skillsArray(): FormArray {
    return this.skillsForm.get('skills') as FormArray;
  }

  ngOnInit(): void {
    this.skillsForm = this.fb.group({
      skills: this.fb.array(this.skills().map(skill => this.createSkillGroup(skill))),
    });
  }

  createSkillGroup(skill?: Skill): FormGroup {
    return this.fb.group({
      name: [skill?.name || '', Validators.required],
      category: [skill?.category || ''],
    });
  }

  addSkill(): void {
    this.skillsArray.push(this.createSkillGroup());
  }

  removeSkill(index: number): void {
    this.skillsArray.removeAt(index);
  }

  onSubmit(): void {
    if (this.skillsForm.valid) {
      this.resumeService
        .updateResumeData({
          skills: this.skillsForm.value.skills,
        })
        .subscribe({
          next: () => {
            this.save.emit();
          },
          error: error => {
            console.error('Failed to save skills:', error);
            alert('Failed to save changes. Please try again.');
          },
        });
    }
  }
}
