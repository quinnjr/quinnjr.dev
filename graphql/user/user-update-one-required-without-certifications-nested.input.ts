import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UserCreateWithoutCertificationsInput } from './user-create-without-certifications.input';
import { Type } from 'class-transformer';
import { UserCreateOrConnectWithoutCertificationsInput } from './user-create-or-connect-without-certifications.input';
import { UserUpsertWithoutCertificationsInput } from './user-upsert-without-certifications.input';
import { Prisma } from '@prisma/client';
import { UserWhereUniqueInput } from './user-where-unique.input';
import { UserUpdateToOneWithWhereWithoutCertificationsInput } from './user-update-to-one-with-where-without-certifications.input';

@InputType()
export class UserUpdateOneRequiredWithoutCertificationsNestedInput {

    @Field(() => UserCreateWithoutCertificationsInput, {nullable:true})
    @Type(() => UserCreateWithoutCertificationsInput)
    create?: UserCreateWithoutCertificationsInput;

    @Field(() => UserCreateOrConnectWithoutCertificationsInput, {nullable:true})
    @Type(() => UserCreateOrConnectWithoutCertificationsInput)
    connectOrCreate?: UserCreateOrConnectWithoutCertificationsInput;

    @Field(() => UserUpsertWithoutCertificationsInput, {nullable:true})
    @Type(() => UserUpsertWithoutCertificationsInput)
    upsert?: UserUpsertWithoutCertificationsInput;

    @Field(() => UserWhereUniqueInput, {nullable:true})
    @Type(() => UserWhereUniqueInput)
    connect?: Prisma.AtLeast<UserWhereUniqueInput, 'id' | 'email' | 'firstName' | 'lastName' | 'linkedin' | 'github'>;

    @Field(() => UserUpdateToOneWithWhereWithoutCertificationsInput, {nullable:true})
    @Type(() => UserUpdateToOneWithWhereWithoutCertificationsInput)
    update?: UserUpdateToOneWithWhereWithoutCertificationsInput;
}
