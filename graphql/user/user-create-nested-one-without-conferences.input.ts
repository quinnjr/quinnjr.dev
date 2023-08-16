import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UserCreateWithoutConferencesInput } from './user-create-without-conferences.input';
import { Type } from 'class-transformer';
import { UserCreateOrConnectWithoutConferencesInput } from './user-create-or-connect-without-conferences.input';
import { Prisma } from '@prisma/client';
import { UserWhereUniqueInput } from './user-where-unique.input';

@InputType()
export class UserCreateNestedOneWithoutConferencesInput {

    @Field(() => UserCreateWithoutConferencesInput, {nullable:true})
    @Type(() => UserCreateWithoutConferencesInput)
    create?: UserCreateWithoutConferencesInput;

    @Field(() => UserCreateOrConnectWithoutConferencesInput, {nullable:true})
    @Type(() => UserCreateOrConnectWithoutConferencesInput)
    connectOrCreate?: UserCreateOrConnectWithoutConferencesInput;

    @Field(() => UserWhereUniqueInput, {nullable:true})
    @Type(() => UserWhereUniqueInput)
    connect?: Prisma.AtLeast<UserWhereUniqueInput, 'id' | 'email' | 'firstName' | 'lastName' | 'linkedin' | 'github'>;
}
