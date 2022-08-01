import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UserCreateWithoutCertificationsInput } from './user-create-without-certifications.input';
import { UserCreateOrConnectWithoutCertificationsInput } from './user-create-or-connect-without-certifications.input';
import { UserUpsertWithoutCertificationsInput } from './user-upsert-without-certifications.input';
import { UserWhereUniqueInput } from './user-where-unique.input';
import { UserUpdateWithoutCertificationsInput } from './user-update-without-certifications.input';

@InputType()
export class UserUpdateOneRequiredWithoutCertificationsNestedInput {

    @Field(() => UserCreateWithoutCertificationsInput, {nullable:true})
    create?: UserCreateWithoutCertificationsInput;

    @Field(() => UserCreateOrConnectWithoutCertificationsInput, {nullable:true})
    connectOrCreate?: UserCreateOrConnectWithoutCertificationsInput;

    @Field(() => UserUpsertWithoutCertificationsInput, {nullable:true})
    upsert?: UserUpsertWithoutCertificationsInput;

    @Field(() => UserWhereUniqueInput, {nullable:true})
    connect?: UserWhereUniqueInput;

    @Field(() => UserUpdateWithoutCertificationsInput, {nullable:true})
    update?: UserUpdateWithoutCertificationsInput;
}
