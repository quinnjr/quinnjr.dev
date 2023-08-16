import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { UserWhereUniqueInput } from './user-where-unique.input';
import { Type } from 'class-transformer';
import { UserCreateWithoutCertificationsInput } from './user-create-without-certifications.input';

@InputType()
export class UserCreateOrConnectWithoutCertificationsInput {

    @Field(() => UserWhereUniqueInput, {nullable:false})
    @Type(() => UserWhereUniqueInput)
    where!: Prisma.AtLeast<UserWhereUniqueInput, 'id' | 'email' | 'firstName' | 'lastName' | 'linkedin' | 'github'>;

    @Field(() => UserCreateWithoutCertificationsInput, {nullable:false})
    @Type(() => UserCreateWithoutCertificationsInput)
    create!: UserCreateWithoutCertificationsInput;
}
