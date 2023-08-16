import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UserCreateWithoutEducationsInput } from './user-create-without-educations.input';
import { Type } from 'class-transformer';
import { UserCreateOrConnectWithoutEducationsInput } from './user-create-or-connect-without-educations.input';
import { Prisma } from '@prisma/client';
import { UserWhereUniqueInput } from './user-where-unique.input';

@InputType()
export class UserCreateNestedOneWithoutEducationsInput {

    @Field(() => UserCreateWithoutEducationsInput, {nullable:true})
    @Type(() => UserCreateWithoutEducationsInput)
    create?: UserCreateWithoutEducationsInput;

    @Field(() => UserCreateOrConnectWithoutEducationsInput, {nullable:true})
    @Type(() => UserCreateOrConnectWithoutEducationsInput)
    connectOrCreate?: UserCreateOrConnectWithoutEducationsInput;

    @Field(() => UserWhereUniqueInput, {nullable:true})
    @Type(() => UserWhereUniqueInput)
    connect?: Prisma.AtLeast<UserWhereUniqueInput, 'id' | 'email' | 'firstName' | 'lastName' | 'linkedin' | 'github'>;
}
