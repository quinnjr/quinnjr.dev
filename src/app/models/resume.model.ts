export interface ContactInfo {
  name: string;
  email: string;
  linkedin?: string;
  github?: string;
  website?: string;
  company?: string;
  profilePicture?: string;
}

export interface Education {
  institution: string;
  degree: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  logo?: string;
  activities?: string[];
}

export interface Experience {
  company: string;
  position: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface Skill {
  name: string;
  category?: string;
}

export interface Certification {
  name: string;
  issuer: string;
  date?: string;
  url?: string;
}

export interface ProfessionalMembership {
  organization: string;
  role?: string;
}

export interface Project {
  name: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  url?: string;
}

export interface ResumeData {
  contact: ContactInfo;
  profile: {
    summary: string[];
    highlights?: string[];
    barAdmission?: string[];
    interests?: string[];
  };
  skills: Skill[];
  education: Education[];
  experience: Experience[];
  projects?: Project[];
  certifications: Certification[];
  professionalMemberships: ProfessionalMembership[];
}
