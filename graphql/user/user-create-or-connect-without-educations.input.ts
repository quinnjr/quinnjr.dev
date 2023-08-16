import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { UserWhereUniqueInput } from './user-where-unique.input';
import { Type } from 'class-transformer';
import { UserCreateWithoutEducationsInput } from './user-create-without-educations.input';

@InputType()
export class UserCreateOrConnectWithoutEducationsInput {

    @Field(() => UserWhereUniqueInput, {nullable:false})
    @Type(() => UserWhereUniqueInput)
    where!: Prisma.AtLeast<UserWhereUniqueInput, 'id' | 'email' | 'firstName' | 'lastName' | 'linkedin' | 'github'>;

    @Field(() => UserCreateWithoutEducationsInput, {nullable:false})
    @Type(() => UserCreateWithoutEducationsInput)
    create!: UserCreateWithoutEducationsInput;
}
