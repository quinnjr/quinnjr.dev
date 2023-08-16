import { Field } from '@nestjs/graphql';
import { ObjectType } from '@nestjs/graphql';
import { ID } from '@nestjs/graphql';
import { HideField } from '@nestjs/graphql';
import { Role } from '../prisma/role.enum';
import { Article } from '../article/article.model';
import { Experience } from '../experience/experience.model';
import { Education } from '../education/education.model';
import { Certification } from '../certification/certification.model';
import { Project } from '../project/project.model';
import { Conference } from '../conference/conference.model';
import { UserCount } from './user-count.output';

@ObjectType()
export class User {

    @Field(() => ID, {nullable:false})
    id!: string;

    @Field(() => String, {nullable:false})
    email!: string;

    @HideField()
    passwordHash!: string;

    @Field(() => String, {nullable:false})
    firstName!: string;

    @Field(() => String, {nullable:true})
    middleName!: string | null;

    @Field(() => String, {nullable:false})
    lastName!: string;

    @Field(() => String, {nullable:true})
    website!: string | null;

    @Field(() => String, {nullable:true})
    linkedin!: string | null;

    @Field(() => String, {nullable:true})
    github!: string | null;

    @Field(() => String, {nullable:true})
    profilePicture!: string | null;

    @Field(() => String, {nullable:false})
    profile!: string;

    @Field(() => [String], {nullable:true})
    profileHighlights!: Array<string>;

    @Field(() => Date, {nullable:false})
    birthday!: Date;

    @Field(() => [String], {nullable:true})
    skills!: Array<string>;

    @Field(() => [String], {nullable:true})
    yubikeys!: Array<string>;

    @Field(() => [String], {nullable:true})
    professionalMemberships!: Array<string>;

    @Field(() => Role, {nullable:false,defaultValue:'User'})
    role!: keyof typeof Role;

    @HideField()
    createdAt!: Date;

    @Field(() => Date, {nullable:false})
    updatedAt!: Date;

    @Field(() => [Article], {nullable:true})
    articles?: Array<Article>;

    @Field(() => [Experience], {nullable:true})
    experiences?: Array<Experience>;

    @Field(() => [Education], {nullable:true})
    educations?: Array<Education>;

    @Field(() => [Certification], {nullable:true})
    certifications?: Array<Certification>;

    @Field(() => [Project], {nullable:true})
    projects?: Array<Project>;

    @Field(() => [Conference], {nullable:true})
    conferences?: Array<Conference>;

    @Field(() => UserCount, {nullable:false})
    _count?: UserCount;
}
