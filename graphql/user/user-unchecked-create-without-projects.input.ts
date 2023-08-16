import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { HideField } from '@nestjs/graphql';
import { UserCreateprofileHighlightsInput } from './user-createprofile-highlights.input';
import { UserCreateskillsInput } from './user-createskills.input';
import { UserCreateyubikeysInput } from './user-createyubikeys.input';
import { UserCreateprofessionalMembershipsInput } from './user-createprofessional-memberships.input';
import { Role } from '../prisma/role.enum';
import { ArticleUncheckedCreateNestedManyWithoutAuthorInput } from '../article/article-unchecked-create-nested-many-without-author.input';
import { ExperienceUncheckedCreateNestedManyWithoutUserInput } from '../experience/experience-unchecked-create-nested-many-without-user.input';
import { EducationUncheckedCreateNestedManyWithoutUserInput } from '../education/education-unchecked-create-nested-many-without-user.input';
import { CertificationUncheckedCreateNestedManyWithoutUserInput } from '../certification/certification-unchecked-create-nested-many-without-user.input';
import { ConferenceUncheckedCreateNestedManyWithoutUserInput } from '../conference/conference-unchecked-create-nested-many-without-user.input';

@InputType()
export class UserUncheckedCreateWithoutProjectsInput {

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

    @Field(() => Date, {nullable:false})
    birthday!: Date | string;

    @Field(() => UserCreateskillsInput, {nullable:true})
    skills?: UserCreateskillsInput;

    @Field(() => UserCreateyubikeysInput, {nullable:true})
    yubikeys?: UserCreateyubikeysInput;

    @Field(() => UserCreateprofessionalMembershipsInput, {nullable:true})
    professionalMemberships?: UserCreateprofessionalMembershipsInput;

    @Field(() => Role, {nullable:true})
    role?: keyof typeof Role;

    @Field(() => Date, {nullable:true})
    createdAt?: Date | string;

    @Field(() => Date, {nullable:true})
    updatedAt?: Date | string;

    @Field(() => ArticleUncheckedCreateNestedManyWithoutAuthorInput, {nullable:true})
    articles?: ArticleUncheckedCreateNestedManyWithoutAuthorInput;

    @Field(() => ExperienceUncheckedCreateNestedManyWithoutUserInput, {nullable:true})
    experiences?: ExperienceUncheckedCreateNestedManyWithoutUserInput;

    @Field(() => EducationUncheckedCreateNestedManyWithoutUserInput, {nullable:true})
    educations?: EducationUncheckedCreateNestedManyWithoutUserInput;

    @Field(() => CertificationUncheckedCreateNestedManyWithoutUserInput, {nullable:true})
    certifications?: CertificationUncheckedCreateNestedManyWithoutUserInput;

    @Field(() => ConferenceUncheckedCreateNestedManyWithoutUserInput, {nullable:true})
    conferences?: ConferenceUncheckedCreateNestedManyWithoutUserInput;
}
