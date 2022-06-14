import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { StringFieldUpdateOperationsInput } from '../prisma/string-field-update-operations.input';
import { HideField } from '@nestjs/graphql';
import { NullableStringFieldUpdateOperationsInput } from '../prisma/nullable-string-field-update-operations.input';
import { UserUpdateprofileHighlightsInput } from './user-updateprofile-highlights.input';
import { DateTimeFieldUpdateOperationsInput } from '../prisma/date-time-field-update-operations.input';
import { UserUpdateskillsInput } from './user-updateskills.input';
import { UserUpdateyubikeysInput } from './user-updateyubikeys.input';
import { UserUpdateprofessionalMembershipsInput } from './user-updateprofessional-memberships.input';
import { EnumRoleFieldUpdateOperationsInput } from '../prisma/enum-role-field-update-operations.input';
import { ArticleUncheckedUpdateManyWithoutAuthorInput } from '../article/article-unchecked-update-many-without-author.input';
import { ExperienceUncheckedUpdateManyWithoutUserInput } from '../experience/experience-unchecked-update-many-without-user.input';
import { EducationUncheckedUpdateManyWithoutUserInput } from '../education/education-unchecked-update-many-without-user.input';
import { CertificationUncheckedUpdateManyWithoutUserInput } from '../certification/certification-unchecked-update-many-without-user.input';
import { ProjectUncheckedUpdateManyWithoutUserInput } from '../project/project-unchecked-update-many-without-user.input';
import { ConferenceUncheckedUpdateManyWithoutUserInput } from '../conference/conference-unchecked-update-many-without-user.input';

@InputType()
export class UserUncheckedUpdateInput {

    @Field(() => StringFieldUpdateOperationsInput, {nullable:true})
    id?: StringFieldUpdateOperationsInput;

    @Field(() => StringFieldUpdateOperationsInput, {nullable:true})
    email?: StringFieldUpdateOperationsInput;

    @HideField()
    passwordHash?: StringFieldUpdateOperationsInput;

    @Field(() => StringFieldUpdateOperationsInput, {nullable:true})
    firstName?: StringFieldUpdateOperationsInput;

    @Field(() => NullableStringFieldUpdateOperationsInput, {nullable:true})
    middleName?: NullableStringFieldUpdateOperationsInput;

    @Field(() => StringFieldUpdateOperationsInput, {nullable:true})
    lastName?: StringFieldUpdateOperationsInput;

    @Field(() => NullableStringFieldUpdateOperationsInput, {nullable:true})
    website?: NullableStringFieldUpdateOperationsInput;

    @Field(() => NullableStringFieldUpdateOperationsInput, {nullable:true})
    linkedin?: NullableStringFieldUpdateOperationsInput;

    @Field(() => NullableStringFieldUpdateOperationsInput, {nullable:true})
    github?: NullableStringFieldUpdateOperationsInput;

    @Field(() => NullableStringFieldUpdateOperationsInput, {nullable:true})
    profilePicture?: NullableStringFieldUpdateOperationsInput;

    @Field(() => StringFieldUpdateOperationsInput, {nullable:true})
    profile?: StringFieldUpdateOperationsInput;

    @Field(() => UserUpdateprofileHighlightsInput, {nullable:true})
    profileHighlights?: UserUpdateprofileHighlightsInput;

    @Field(() => DateTimeFieldUpdateOperationsInput, {nullable:true})
    birthday?: DateTimeFieldUpdateOperationsInput;

    @Field(() => UserUpdateskillsInput, {nullable:true})
    skills?: UserUpdateskillsInput;

    @Field(() => UserUpdateyubikeysInput, {nullable:true})
    yubikeys?: UserUpdateyubikeysInput;

    @Field(() => UserUpdateprofessionalMembershipsInput, {nullable:true})
    professionalMemberships?: UserUpdateprofessionalMembershipsInput;

    @Field(() => EnumRoleFieldUpdateOperationsInput, {nullable:true})
    role?: EnumRoleFieldUpdateOperationsInput;

    @Field(() => ArticleUncheckedUpdateManyWithoutAuthorInput, {nullable:true})
    articles?: ArticleUncheckedUpdateManyWithoutAuthorInput;

    @Field(() => ExperienceUncheckedUpdateManyWithoutUserInput, {nullable:true})
    experiences?: ExperienceUncheckedUpdateManyWithoutUserInput;

    @Field(() => EducationUncheckedUpdateManyWithoutUserInput, {nullable:true})
    educations?: EducationUncheckedUpdateManyWithoutUserInput;

    @Field(() => CertificationUncheckedUpdateManyWithoutUserInput, {nullable:true})
    certifications?: CertificationUncheckedUpdateManyWithoutUserInput;

    @Field(() => ProjectUncheckedUpdateManyWithoutUserInput, {nullable:true})
    projects?: ProjectUncheckedUpdateManyWithoutUserInput;

    @Field(() => ConferenceUncheckedUpdateManyWithoutUserInput, {nullable:true})
    conferences?: ConferenceUncheckedUpdateManyWithoutUserInput;

    @Field(() => DateTimeFieldUpdateOperationsInput, {nullable:true})
    createdAt?: DateTimeFieldUpdateOperationsInput;

    @Field(() => DateTimeFieldUpdateOperationsInput, {nullable:true})
    updatedAt?: DateTimeFieldUpdateOperationsInput;
}
