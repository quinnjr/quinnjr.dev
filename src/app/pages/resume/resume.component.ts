import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, type OnInit } from '@angular/core';
import type { Observable } from 'rxjs';

import type { ResumeData } from '../../models/resume.model';
import { ResumeService } from '../../services/resume.service';

@Component({
  selector: 'app-resume',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './resume.component.html',
  styleUrl: './resume.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumeComponent implements OnInit {
  private resumeService = inject(ResumeService);
  resumeData$!: Observable<ResumeData>;

  ngOnInit(): void {
    this.resumeData$ = this.resumeService.getResumeData();
  }
}
