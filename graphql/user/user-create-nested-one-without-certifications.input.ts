import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UserCreateWithoutCertificationsInput } from './user-create-without-certifications.input';
import { Type } from 'class-transformer';
import { UserCreateOrConnectWithoutCertificationsInput } from './user-create-or-connect-without-certifications.input';
import { Prisma } from '@prisma/client';
import { UserWhereUniqueInput } from './user-where-unique.input';

@InputType()
export class UserCreateNestedOneWithoutCertificationsInput {

    @Field(() => UserCreateWithoutCertificationsInput, {nullable:true})
    @Type(() => UserCreateWithoutCertificationsInput)
    create?: UserCreateWithoutCertificationsInput;

    @Field(() => UserCreateOrConnectWithoutCertificationsInput, {nullable:true})
    @Type(() => UserCreateOrConnectWithoutCertificationsInput)
    connectOrCreate?: UserCreateOrConnectWithoutCertificationsInput;

    @Field(() => UserWhereUniqueInput, {nullable:true})
    @Type(() => UserWhereUniqueInput)
    connect?: Prisma.AtLeast<UserWhereUniqueInput, 'id' | 'email' | 'firstName' | 'lastName' | 'linkedin' | 'github'>;
}
