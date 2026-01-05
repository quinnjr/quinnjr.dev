import { TestBed } from '@angular/core/testing';

import { ResumeService } from './resume.service';

describe('ResumeService', () => {
  let service: ResumeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResumeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return resume data', done => {
    service.getResumeData().subscribe(data => {
      expect(data).toBeTruthy();
      expect(data.contact).toBeTruthy();
      expect(data.contact.name).toBe('Joseph R. Quinn, Esq.');
      done();
    });
  });

  it('should update contact info', done => {
    const newEmail = 'test@example.com';
    service.updateContactInfo({ email: newEmail });

    service.getResumeData().subscribe(data => {
      expect(data.contact.email).toBe(newEmail);
      done();
    });
  });

  it('should sync with LinkedIn data', done => {
    const linkedInData = {
      firstName: 'Joseph',
      lastName: 'Quinn',
      profilePictureUrl: 'https://example.com/profile.jpg',
      vanityName: 'quinnjosephr',
    };

    service.syncWithLinkedIn(linkedInData);

    service.getResumeData().subscribe(data => {
      expect(data.contact.name).toBe('Joseph Quinn, Esq.');
      expect(data.contact.profilePicture).toBe('/profile_picture.jpg');
      expect(data.contact.linkedin).toBe('https://www.linkedin.com/in/quinnjosephr/');
      done();
    });
  });
});
