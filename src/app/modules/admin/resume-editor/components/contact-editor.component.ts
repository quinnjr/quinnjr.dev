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
import { FormBuilder, type FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import type { ContactInfo } from '../../../../models/resume.model';
import { ResumeService } from '../../../../services/resume.service';

@Component({
  selector: 'app-contact-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Contact Information</h2>
      <form [formGroup]="contactForm" (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name
          </label>
          <input
            type="text"
            formControlName="name"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            formControlName="email"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            LinkedIn URL
          </label>
          <input
            type="url"
            formControlName="linkedin"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            GitHub URL
          </label>
          <input
            type="url"
            formControlName="github"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Website URL
          </label>
          <input
            type="url"
            formControlName="website"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Company URL
          </label>
          <input
            type="url"
            formControlName="company"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Profile Picture URL
          </label>
          <input
            type="text"
            formControlName="profilePicture"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Path to profile picture (e.g., /profile_picture.jpg)
          </p>
        </div>

        <div class="flex justify-end">
          <button
            type="submit"
            [disabled]="!contactForm.valid"
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
export class ContactEditorComponent implements OnInit {
  contact = input.required<ContactInfo>();
  @Output() save = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private resumeService = inject(ResumeService);

  contactForm!: FormGroup;

  ngOnInit(): void {
    this.contactForm = this.fb.group({
      name: [this.contact().name, Validators.required],
      email: [this.contact().email, [Validators.required, Validators.email]],
      linkedin: [this.contact().linkedin],
      github: [this.contact().github],
      website: [this.contact().website],
      company: [this.contact().company],
      profilePicture: [this.contact().profilePicture],
    });
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      this.resumeService.updateContactInfo(this.contactForm.value).subscribe({
        next: () => {
          this.save.emit();
        },
        error: error => {
          console.error('Failed to save contact info:', error);
          alert('Failed to save changes. Please try again.');
        },
      });
    }
  }
}
