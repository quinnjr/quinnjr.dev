import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UserWhereInput } from './user-where.input';
import { StringFilter } from '../prisma/string-filter.input';
import { HideField } from '@nestjs/graphql';
import { StringNullableFilter } from '../prisma/string-nullable-filter.input';
import { StringNullableListFilter } from '../prisma/string-nullable-list-filter.input';
import { DateTimeFilter } from '../prisma/date-time-filter.input';
import { EnumRoleFilter } from '../prisma/enum-role-filter.input';
import { ArticleListRelationFilter } from '../article/article-list-relation-filter.input';
import { ExperienceListRelationFilter } from '../experience/experience-list-relation-filter.input';
import { EducationListRelationFilter } from '../education/education-list-relation-filter.input';
import { CertificationListRelationFilter } from '../certification/certification-list-relation-filter.input';
import { ProjectListRelationFilter } from '../project/project-list-relation-filter.input';
import { ConferenceListRelationFilter } from '../conference/conference-list-relation-filter.input';

@InputType()
export class UserWhereUniqueInput {

    @Field(() => String, {nullable:true})
    id?: string;

    @Field(() => String, {nullable:true})
    email?: string;

    @Field(() => String, {nullable:true})
    firstName?: string;

    @Field(() => String, {nullable:true})
    lastName?: string;

    @Field(() => String, {nullable:true})
    linkedin?: string;

    @Field(() => String, {nullable:true})
    github?: string;

    @Field(() => [UserWhereInput], {nullable:true})
    AND?: Array<UserWhereInput>;

    @Field(() => [UserWhereInput], {nullable:true})
    OR?: Array<UserWhereInput>;

    @Field(() => [UserWhereInput], {nullable:true})
    NOT?: Array<UserWhereInput>;

    @HideField()
    passwordHash?: StringFilter;

    @Field(() => StringNullableFilter, {nullable:true})
    middleName?: StringNullableFilter;

    @Field(() => StringNullableFilter, {nullable:true})
    website?: StringNullableFilter;

    @Field(() => StringNullableFilter, {nullable:true})
    profilePicture?: StringNullableFilter;

    @Field(() => StringFilter, {nullable:true})
    profile?: StringFilter;

    @Field(() => StringNullableListFilter, {nullable:true})
    profileHighlights?: StringNullableListFilter;

    @Field(() => DateTimeFilter, {nullable:true})
    birthday?: DateTimeFilter;

    @Field(() => StringNullableListFilter, {nullable:true})
    skills?: StringNullableListFilter;

    @Field(() => StringNullableListFilter, {nullable:true})
    yubikeys?: StringNullableListFilter;

    @Field(() => StringNullableListFilter, {nullable:true})
    professionalMemberships?: StringNullableListFilter;

    @Field(() => EnumRoleFilter, {nullable:true})
    role?: EnumRoleFilter;

    @Field(() => DateTimeFilter, {nullable:true})
    createdAt?: DateTimeFilter;

    @Field(() => DateTimeFilter, {nullable:true})
    updatedAt?: DateTimeFilter;

    @Field(() => ArticleListRelationFilter, {nullable:true})
    articles?: ArticleListRelationFilter;

    @Field(() => ExperienceListRelationFilter, {nullable:true})
    experiences?: ExperienceListRelationFilter;

    @Field(() => EducationListRelationFilter, {nullable:true})
    educations?: EducationListRelationFilter;

    @Field(() => CertificationListRelationFilter, {nullable:true})
    certifications?: CertificationListRelationFilter;

    @Field(() => ProjectListRelationFilter, {nullable:true})
    projects?: ProjectListRelationFilter;

    @Field(() => ConferenceListRelationFilter, {nullable:true})
    conferences?: ConferenceListRelationFilter;
}
