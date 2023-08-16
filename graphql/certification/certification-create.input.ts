import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UserCreateNestedOneWithoutCertificationsInput } from '../user/user-create-nested-one-without-certifications.input';

@InputType()
export class CertificationCreateInput {

    @Field(() => String, {nullable:true})
    id?: string;

    @Field(() => String, {nullable:false})
    name!: string;

    @Field(() => String, {nullable:false})
    certifier!: string;

    @Field(() => UserCreateNestedOneWithoutCertificationsInput, {nullable:false})
    user!: UserCreateNestedOneWithoutCertificationsInput;
}
