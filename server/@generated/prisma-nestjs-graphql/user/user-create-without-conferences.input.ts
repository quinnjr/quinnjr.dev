import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { HideField } from '@nestjs/graphql';
import { UserCreateprofileHighlightsInput } from './user-createprofile-highlights.input';
import { UserCreateskillsInput } from './user-createskills.input';
import { UserCreateyubikeysInput } from './user-createyubikeys.input';
import { UserCreateprofessionalMembershipsInput } from './user-createprofessional-memberships.input';
import { Role } from '../prisma/role.enum';
import { ArticleCreateNestedManyWithoutAuthorInput } from '../article/article-create-nested-many-without-author.input';
import { ExperienceCreateNestedManyWithoutUserInput } from '../experience/experience-create-nested-many-without-user.input';
import { EducationCreateNestedManyWithoutUserInput } from '../education/education-create-nested-many-without-user.input';
import { CertificationCreateNestedManyWithoutUserInput } from '../certification/certification-create-nested-many-without-user.input';
import { ProjectCreateNestedManyWithoutUserInput } from '../project/project-create-nested-many-without-user.input';

@InputType()
export class UserCreateWithoutConferencesInput {

    @Field(() => String, {nullable:true})
    id?: string;

    @Field(() => String, {nullable:false})
    email!: string;

    @HideField()
    passwordHash!: string;

    @Field(() => String, {nullable:false})
    firstName!: string;

    @Field(() => String, {nullable:true})
    middleName?: string;

    @Field(() => String, {nullable:false})
    lastName!: string;

    @Field(() => String, {nullable:true})
    website?: string;

    @Field(() => String, {nullable:true})
    linkedin?: string;

    @Field(() => String, {nullable:true})
    github?: string;

    @Field(() => String, {nullable:true})
    profilePicture?: string;

    @Field(() => String, {nullable:false})
    profile!: string;

    @Field(() => UserCreateprofileHighlightsInput, {nullable:true})
    profileHighlights?: UserCreateprofileHighlightsInput;

    @Field(() => Date, {nullable:true})
    birthday?: Date | string;

    @Field(() => UserCreateskillsInput, {nullable:true})
    skills?: UserCreateskillsInput;

    @Field(() => UserCreateyubikeysInput, {nullable:true})
    yubikeys?: UserCreateyubikeysInput;

    @Field(() => UserCreateprofessionalMembershipsInput, {nullable:true})
    professionalMemberships?: UserCreateprofessionalMembershipsInput;

    @Field(() => Role, {nullable:true})
    role?: keyof typeof Role;

    @Field(() => ArticleCreateNestedManyWithoutAuthorInput, {nullable:true})
    articles?: ArticleCreateNestedManyWithoutAuthorInput;

    @Field(() => ExperienceCreateNestedManyWithoutUserInput, {nullable:true})
    experiences?: ExperienceCreateNestedManyWithoutUserInput;

    @Field(() => EducationCreateNestedManyWithoutUserInput, {nullable:true})
    educations?: EducationCreateNestedManyWithoutUserInput;

    @Field(() => CertificationCreateNestedManyWithoutUserInput, {nullable:true})
    certifications?: CertificationCreateNestedManyWithoutUserInput;

    @Field(() => ProjectCreateNestedManyWithoutUserInput, {nullable:true})
    projects?: ProjectCreateNestedManyWithoutUserInput;

    @Field(() => Date, {nullable:true})
    createdAt?: Date | string;

    @Field(() => Date, {nullable:true})
    updatedAt?: Date | string;
}
