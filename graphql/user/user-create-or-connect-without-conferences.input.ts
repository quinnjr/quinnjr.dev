import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { UserWhereUniqueInput } from './user-where-unique.input';
import { Type } from 'class-transformer';
import { UserCreateWithoutConferencesInput } from './user-create-without-conferences.input';

@InputType()
export class UserCreateOrConnectWithoutConferencesInput {

    @Field(() => UserWhereUniqueInput, {nullable:false})
    @Type(() => UserWhereUniqueInput)
    where!: Prisma.AtLeast<UserWhereUniqueInput, 'id' | 'email' | 'firstName' | 'lastName' | 'linkedin' | 'github'>;

    @Field(() => UserCreateWithoutConferencesInput, {nullable:false})
    @Type(() => UserCreateWithoutConferencesInput)
    create!: UserCreateWithoutConferencesInput;
}
