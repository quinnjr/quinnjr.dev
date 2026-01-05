import { injectable } from 'tsyringe';

import { DatabaseService } from './database.service';

export interface ResumeData {
  id?: string;
  name: string;
  email: string;
  linkedin?: string;
  github?: string;
  website?: string;
  company?: string;
  profilePicture?: string;
  summary: string[];
  barAdmission?: string[];
  interests?: string[];
  experience: Experience[];
  education: Education[];
  projects?: Project[];
  skills: Skill[];
  certifications: Certification[];
  memberships?: ProfessionalMembership[];
  userId: string;
  version?: number;
  createdAt?: Date;
  updatedAt?: Date;
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

export interface Project {
  name: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  url?: string;
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

@injectable()
export class ResumeService {
  constructor(private db: DatabaseService) {}

  /**
   * Get the resume (returns the most recent one for the user)
   */
  async getResume(userId: string): Promise<ResumeData | null> {
    const resume = await this.db.prisma.resume.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    if (!resume) {
      return null;
    }

    return this.mapToResumeData(resume);
  }

  /**
   * Get the public resume (no userId filter, returns the latest)
   */
  async getPublicResume(): Promise<ResumeData | null> {
    const resume = await this.db.prisma.resume.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!resume) {
      return null;
    }

    return this.mapToResumeData(resume);
  }

  /**
   * Create or update resume
   */
  async upsertResume(data: ResumeData): Promise<ResumeData> {
    const existingResume = await this.db.prisma.resume.findFirst({
      where: { userId: data.userId },
      orderBy: { updatedAt: 'desc' },
    });

    const resumeData = {
      name: data.name,
      email: data.email,
      linkedin: data.linkedin,
      github: data.github,
      website: data.website,
      company: data.company,
      profilePicture: data.profilePicture,
      summary: data.summary,
      barAdmission: data.barAdmission || [],
      interests: data.interests || [],
      experience: data.experience,
      education: data.education,
      projects: data.projects || [],
      skills: data.skills,
      certifications: data.certifications,
      memberships: data.memberships || [],
      userId: data.userId,
      version: existingResume ? existingResume.version + 1 : 1,
    };

    const resume = existingResume
      ? await this.db.prisma.resume.update({
          where: { id: existingResume.id },
          data: resumeData,
        })
      : await this.db.prisma.resume.create({
          data: resumeData,
        });

    return this.mapToResumeData(resume);
  }

  /**
   * Update partial resume data
   */
  async updateResume(userId: string, updates: Partial<ResumeData>): Promise<ResumeData> {
    const existingResume = await this.db.prisma.resume.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    if (!existingResume) {
      throw new Error('Resume not found');
    }

    const updateData: Record<string, unknown> = {
      version: existingResume.version + 1,
    };

    // Only update fields that are provided
    if (updates.name !== undefined) updateData['name'] = updates.name;
    if (updates.email !== undefined) updateData['email'] = updates.email;
    if (updates.linkedin !== undefined) updateData['linkedin'] = updates.linkedin;
    if (updates.github !== undefined) updateData['github'] = updates.github;
    if (updates.website !== undefined) updateData['website'] = updates.website;
    if (updates.company !== undefined) updateData['company'] = updates.company;
    if (updates.profilePicture !== undefined) updateData['profilePicture'] = updates.profilePicture;
    if (updates.summary !== undefined) updateData['summary'] = updates.summary;
    if (updates.barAdmission !== undefined) updateData['barAdmission'] = updates.barAdmission;
    if (updates.interests !== undefined) updateData['interests'] = updates.interests;
    if (updates.experience !== undefined) updateData['experience'] = updates.experience;
    if (updates.education !== undefined) updateData['education'] = updates.education;
    if (updates.projects !== undefined) updateData['projects'] = updates.projects;
    if (updates.skills !== undefined) updateData['skills'] = updates.skills;
    if (updates.certifications !== undefined) updateData['certifications'] = updates.certifications;
    if (updates.memberships !== undefined) updateData['memberships'] = updates.memberships;

    const resume = await this.db.prisma.resume.update({
      where: { id: existingResume.id },
      data: updateData,
    });

    return this.mapToResumeData(resume);
  }

  /**
   * Get resume version history
   */
  async getResumeHistory(userId: string, limit = 10): Promise<ResumeData[]> {
    const resumes = await this.db.prisma.resume.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    return resumes.map(resume => this.mapToResumeData(resume));
  }

  /**
   * Delete resume
   */
  async deleteResume(userId: string, resumeId: string): Promise<void> {
    await this.db.prisma.resume.delete({
      where: {
        id: resumeId,
        userId,
      },
    });
  }

  /**
   * Map Prisma resume to ResumeData
   */
  private mapToResumeData(resume: {
    id: string;
    name: string;
    email: string;
    linkedin: string | null;
    github: string | null;
    website: string | null;
    company: string | null;
    profilePicture: string | null;
    summary: unknown;
    barAdmission: unknown;
    interests: unknown;
    experience: unknown;
    education: unknown;
    projects: unknown;
    skills: unknown;
    certifications: unknown;
    memberships: unknown;
    userId: string;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): ResumeData {
    return {
      id: resume.id,
      name: resume.name,
      email: resume.email,
      linkedin: resume.linkedin || undefined,
      github: resume.github || undefined,
      website: resume.website || undefined,
      company: resume.company || undefined,
      profilePicture: resume.profilePicture || undefined,
      summary: resume.summary as string[],
      barAdmission: (resume.barAdmission as string[]) || undefined,
      interests: (resume.interests as string[]) || undefined,
      experience: resume.experience as Experience[],
      education: resume.education as Education[],
      projects: (resume.projects as Project[]) || undefined,
      skills: resume.skills as Skill[],
      certifications: resume.certifications as Certification[],
      memberships: (resume.memberships as ProfessionalMembership[]) || undefined,
      userId: resume.userId,
      version: resume.version,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    };
  }
}
