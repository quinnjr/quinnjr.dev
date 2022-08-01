import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { StringFieldUpdateOperationsInput } from '../prisma/string-field-update-operations.input';
import { UserUpdateOneRequiredWithoutCertificationsNestedInput } from '../user/user-update-one-required-without-certifications-nested.input';

@InputType()
export class CertificationUpdateInput {

    @Field(() => StringFieldUpdateOperationsInput, {nullable:true})
    id?: StringFieldUpdateOperationsInput;

    @Field(() => StringFieldUpdateOperationsInput, {nullable:true})
    name?: StringFieldUpdateOperationsInput;

    @Field(() => StringFieldUpdateOperationsInput, {nullable:true})
    certifier?: StringFieldUpdateOperationsInput;

    @Field(() => UserUpdateOneRequiredWithoutCertificationsNestedInput, {nullable:true})
    user?: UserUpdateOneRequiredWithoutCertificationsNestedInput;
}
