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
import { ArticleUpdateManyWithoutAuthorNestedInput } from '../article/article-update-many-without-author-nested.input';
import { ExperienceUpdateManyWithoutUserNestedInput } from '../experience/experience-update-many-without-user-nested.input';
import { EducationUpdateManyWithoutUserNestedInput } from '../education/education-update-many-without-user-nested.input';
import { CertificationUpdateManyWithoutUserNestedInput } from '../certification/certification-update-many-without-user-nested.input';
import { ProjectUpdateManyWithoutUserNestedInput } from '../project/project-update-many-without-user-nested.input';
import { ConferenceUpdateManyWithoutUserNestedInput } from '../conference/conference-update-many-without-user-nested.input';

@InputType()
export class UserUpdateInput {

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

    @Field(() => DateTimeFieldUpdateOperationsInput, {nullable:true})
    createdAt?: DateTimeFieldUpdateOperationsInput;

    @Field(() => DateTimeFieldUpdateOperationsInput, {nullable:true})
    updatedAt?: DateTimeFieldUpdateOperationsInput;

    @Field(() => ArticleUpdateManyWithoutAuthorNestedInput, {nullable:true})
    articles?: ArticleUpdateManyWithoutAuthorNestedInput;

    @Field(() => ExperienceUpdateManyWithoutUserNestedInput, {nullable:true})
    experiences?: ExperienceUpdateManyWithoutUserNestedInput;

    @Field(() => EducationUpdateManyWithoutUserNestedInput, {nullable:true})
    educations?: EducationUpdateManyWithoutUserNestedInput;

    @Field(() => CertificationUpdateManyWithoutUserNestedInput, {nullable:true})
    certifications?: CertificationUpdateManyWithoutUserNestedInput;

    @Field(() => ProjectUpdateManyWithoutUserNestedInput, {nullable:true})
    projects?: ProjectUpdateManyWithoutUserNestedInput;

    @Field(() => ConferenceUpdateManyWithoutUserNestedInput, {nullable:true})
    conferences?: ConferenceUpdateManyWithoutUserNestedInput;
}
