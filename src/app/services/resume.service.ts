import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';

import type { ResumeData } from '../models/resume.model';

@Injectable({
  providedIn: 'root',
})
export class ResumeService {
  private http = inject(HttpClient);
  private apiUrl = '/api/resume';

  // Default/fallback resume data
  private defaultResumeData: ResumeData = {
    contact: {
      name: 'Joseph R. Quinn, Esq.',
      email: 'joseph@quinnjr.tech',
      linkedin: 'https://www.linkedin.com/in/quinnjosephr/',
      github: 'https://github.com/quinnjr',
      website: 'https://quinnjr.dev',
      company: 'https://pegausheavy.dev',
      profilePicture: '/profile_picture.jpg',
    },
    profile: {
      summary: [
        'A dedicated, versatile, fast-learner anxious to expand his programming and legal skills and make an immediate contribution.',
        'Able to efficiently juggle workloads, prevail over deadlines, and adapt to new and challenging environments.',
        'A strong team player with great ethical standards, communication skills, and respect for confidentiality.',
      ],
      barAdmission: ['Florida Bar - September 2016'],
      interests: [
        'Open Source technologies',
        'Intellectual Property',
        'Cyber Law',
        'Linux',
        'Cyber Security',
        'Systems Programming',
        'GPU-assisted Programming',
      ],
    },
    skills: [
      { name: 'Analytics, Informatics', category: 'Technical' },
      { name: 'Cyber Law', category: 'Legal' },
      { name: 'Linux server management', category: 'Technical' },
      { name: 'Rust, Go, C++/C, PHP, Typescript/Javascript, Node.js', category: 'Programming' },
      { name: 'C#, F#, Python, SQL, NoSQL', category: 'Programming' },
      {
        name: 'Agile, DevOps, Docker, Kubernetes, Jenkins/JenkinsX, Unity',
        category: 'Tools & Frameworks',
      },
      { name: 'Intermediate Spanish', category: 'Languages' },
      { name: 'Zoom, Microsoft Teams, Google Meet, Amazon Chime', category: 'Communication' },
    ],
    education: [
      {
        institution: 'Florida International University',
        degree: 'Masters Candidate in Computer Science',
        startDate: 'Fall 2022',
        endDate: 'Present',
        logo: '/fiu.jpg',
        activities: [
          'FIU Bioinformatics Research Group - Lead Student Developer',
          'Google DSC',
          'Upsilon Pi Epsilon',
          'The National Society of Leadership and Success',
        ],
      },
      {
        institution: 'Florida International University',
        degree: 'Bachelors of Science in Computer Science',
        startDate: 'Fall 2017',
        endDate: 'Spring 2022',
        logo: '/fiu.jpg',
      },
      {
        institution: 'University of Miami School of Law',
        degree: 'Juris Doctorate',
        startDate: 'Fall 2012',
        endDate: 'Spring 2015',
        location: 'Miami, FL',
        logo: '/um.jpg',
        activities: [
          'International Law Society - Co-Vice President, Parliamentarian',
          'Irish American Law Student Association',
        ],
      },
      {
        institution: 'Michigan State University School of Law',
        degree: 'Visiting Juris Doctorate Candidate',
        field: 'Summer Abroad Intellectual Property and Cybercrime Institute',
        startDate: 'Summer 2014',
        location: 'Rijeka/Dubrovnik, Croatia',
        logo: '/msu.jpg',
      },
      {
        institution: 'Belmont University',
        degree: 'Bachelors in the Arts in Politics and Public Law',
        startDate: 'Fall 2008',
        endDate: 'Fall 2011',
        logo: '/belmont.jpg',
        activities: [
          "Dean's List (2 semesters)",
          'Pre-Law Society - President',
          'Phi Mu Alpha Sinfonia Fraternity - Vice President, Province Council Representative',
          'James Madison Society',
          'The Vision Student Newspaper',
        ],
      },
    ],
    experience: [
      {
        company: 'Skillcourt, LLC',
        position: 'Project Manager/Technology Consultant',
        location: 'Deerfield Beach, FL',
        startDate: 'May 2021',
        endDate: 'Nov 2024',
        current: false,
        description:
          'Consulting on multi-platform development projects. Administrating server infrastructure. Mentoring FIU Capstone development students. Developing physical product firmware.',
      },
      {
        company: 'Florida International University',
        position: 'Learning Assistant',
        location: 'Miami, FL',
        startDate: 'August 2020',
        endDate: 'May 2022',
        description:
          'Assisted supervising Professor with running class; mentored and aided students. Achieved high levels of class passing grades.',
      },
      {
        company:
          'Eleanor R. Cristol and Judge A. Jay Cristol Bankruptcy Pro Bono Assistance Clinic',
        position: 'Extern',
        location: 'Miami, FL',
        startDate: 'August 2014',
        endDate: 'May 2015',
        description:
          'Reviewed documentation, completed bankruptcy filings, attended trustee meetings.',
      },
    ],
    projects: [
      {
        name: 'PluMA',
        date: 'Jan 2020',
        description: 'Bioinformatics pipeline software',
        url: 'https://biorg.cs.fiu.edu/pluma/',
      },
      {
        name: 'SkillCourt',
        startDate: 'May 2021',
        endDate: 'Nov 2024',
        description: 'Multi-platform development project',
      },
    ],
    certifications: [
      {
        name: 'Linux Foundation LFS261 - DevOps and SRE Fundamentals',
        issuer: 'Linux Foundation',
        url: 'https://training.linuxfoundation.org/training/devops-and-sre-fundamentals-implementing-continuous-delivery-lfs261/',
      },
      {
        name: 'Linux Foundation LFD254 - Containers for Developers and Quality Assurance',
        issuer: 'Linux Foundation',
        url: 'https://training.linuxfoundation.org/training/containers-for-developers-and-quality-assurance/',
      },
      {
        name: 'Linux Foundation LFD259 - Kubernetes for Developers',
        issuer: 'Linux Foundation',
        url: 'https://training.linuxfoundation.org/training/kubernetes-for-developers/',
      },
      {
        name: 'Linux Foundation LFS258 - Kubernetes Fundamentals',
        issuer: 'Linux Foundation',
        url: 'https://training.linuxfoundation.org/training/kubernetes-fundamentals/',
      },
      {
        name: "Linux Foundation LFD103 - A Beginner's Guide to Linux Kernel Development",
        issuer: 'Linux Foundation',
        url: 'https://training.linuxfoundation.org/training/a-beginners-guide-to-linux-kernel-development-lfd103/',
      },
      {
        name: 'NVIDIA Deep Learning Institute - Fundamentals of Accelerated Computing with CUDA',
        issuer: 'NVIDIA',
        url: 'https://www.nvidia.com/en-us/training/',
      },
      {
        name: 'Professional Development Training',
        issuer: 'University of Miami',
      },
      {
        name: 'Open Water Scuba Instructor',
        issuer: 'PADI, Intl.',
      },
    ],
    professionalMemberships: [
      { organization: 'Florida Bar' },
      { organization: 'American Bar Assn.' },
      { organization: 'Professional Assn. of Diving Instructors, Emergency First Response, Intl.' },
      { organization: 'National Society of Leadership and Success' },
    ],
  };

  private resumeSubject = new BehaviorSubject<ResumeData>(this.defaultResumeData);
  private loaded = false;

  constructor() {
    // Load resume from API on initialization
    this.loadResumeFromAPI();
  }

  /**
   * Load resume from API (public endpoint)
   */
  private loadResumeFromAPI(): void {
    this.http
      .get<any>(`${this.apiUrl}/public`)
      .pipe(
        map(apiData => this.mapApiToResumeData(apiData)),
        catchError(error => {
          console.warn('Failed to load resume from API, using default data:', error);
          return of(this.defaultResumeData);
        })
      )
      .subscribe(data => {
        this.resumeSubject.next(data);
        this.loaded = true;
      });
  }

  /**
   * Get resume data as observable
   */
  getResumeData(): Observable<ResumeData> {
    return this.resumeSubject.asObservable();
  }

  /**
   * Reload resume from API
   */
  reloadResume(): Observable<ResumeData> {
    return this.http.get<any>(`${this.apiUrl}/public`).pipe(
      map(apiData => this.mapApiToResumeData(apiData)),
      tap(data => this.resumeSubject.next(data)),
      catchError(error => {
        console.error('Failed to reload resume:', error);
        return of(this.resumeSubject.value);
      })
    );
  }

  /**
   * Update resume data (saves to API)
   */
  updateResumeData(updates: Partial<ResumeData>): Observable<ResumeData> {
    const currentData = this.resumeSubject.value;
    const updatedData = {
      ...currentData,
      ...updates,
    };

    return this.saveResumeToAPI(updatedData);
  }

  /**
   * Update contact info (saves to API)
   */
  updateContactInfo(updates: Partial<ResumeData['contact']>): Observable<ResumeData> {
    const currentData = this.resumeSubject.value;
    const updatedData = {
      ...currentData,
      contact: {
        ...currentData.contact,
        ...updates,
      },
    };

    return this.saveResumeToAPI(updatedData);
  }

  /**
   * Save complete resume to API
   */
  private saveResumeToAPI(data: ResumeData): Observable<ResumeData> {
    // Convert frontend format to API format
    const apiData = this.mapResumeDataToApi(data);

    return this.http.put<any>(`${this.apiUrl}`, apiData).pipe(
      map(response => this.mapApiToResumeData(response)),
      tap(resumeData => this.resumeSubject.next(resumeData)),
      catchError(error => {
        console.error('Failed to save resume:', error);
        // Still update local state even if API fails
        this.resumeSubject.next(data);
        return of(data);
      })
    );
  }

  /**
   * Map API response to frontend ResumeData format
   */
  private mapApiToResumeData(apiData: any): ResumeData {
    return {
      contact: {
        name: apiData.name,
        email: apiData.email,
        linkedin: apiData.linkedin,
        github: apiData.github,
        website: apiData.website,
        company: apiData.company,
        profilePicture: apiData.profilePicture,
      },
      profile: {
        summary: apiData.summary || [],
        barAdmission: apiData.barAdmission,
        interests: apiData.interests,
      },
      experience: apiData.experience || [],
      education: apiData.education || [],
      projects: apiData.projects,
      skills: apiData.skills || [],
      certifications: apiData.certifications || [],
      professionalMemberships: apiData.memberships,
    };
  }

  /**
   * Map frontend ResumeData to API format
   */
  private mapResumeDataToApi(data: ResumeData): any {
    return {
      name: data.contact.name,
      email: data.contact.email,
      linkedin: data.contact.linkedin,
      github: data.contact.github,
      website: data.contact.website,
      company: data.contact.company,
      profilePicture: data.contact.profilePicture,
      summary: data.profile.summary,
      barAdmission: data.profile.barAdmission,
      interests: data.profile.interests,
      experience: data.experience,
      education: data.education,
      projects: data.projects,
      skills: data.skills,
      certifications: data.certifications,
      memberships: data.professionalMemberships,
    };
  }

  /**
   * Sync resume data with LinkedIn profile
   * @param linkedInData LinkedIn profile data
   */
  syncWithLinkedIn(linkedInData: {
    firstName?: string;
    lastName?: string;
    headline?: string;
    profilePictureUrl?: string;
    vanityName?: string;
  }): void {
    const updates: Partial<ResumeData['contact']> = {};

    if (linkedInData.firstName && linkedInData.lastName) {
      updates.name = `${linkedInData.firstName} ${linkedInData.lastName}, Esq.`;
    }

    if (linkedInData.profilePictureUrl) {
      updates.profilePicture = '/profile_picture.jpg';
    }

    if (linkedInData.vanityName) {
      updates.linkedin = `https://www.linkedin.com/in/${linkedInData.vanityName}/`;
    }

    if (Object.keys(updates).length > 0) {
      this.updateContactInfo(updates);
    }
  }
}
