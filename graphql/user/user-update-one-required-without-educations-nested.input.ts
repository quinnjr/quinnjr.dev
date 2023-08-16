import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UserCreateWithoutEducationsInput } from './user-create-without-educations.input';
import { Type } from 'class-transformer';
import { UserCreateOrConnectWithoutEducationsInput } from './user-create-or-connect-without-educations.input';
import { UserUpsertWithoutEducationsInput } from './user-upsert-without-educations.input';
import { Prisma } from '@prisma/client';
import { UserWhereUniqueInput } from './user-where-unique.input';
import { UserUpdateToOneWithWhereWithoutEducationsInput } from './user-update-to-one-with-where-without-educations.input';

@InputType()
export class UserUpdateOneRequiredWithoutEducationsNestedInput {

    @Field(() => UserCreateWithoutEducationsInput, {nullable:true})
    @Type(() => UserCreateWithoutEducationsInput)
    create?: UserCreateWithoutEducationsInput;

    @Field(() => UserCreateOrConnectWithoutEducationsInput, {nullable:true})
    @Type(() => UserCreateOrConnectWithoutEducationsInput)
    connectOrCreate?: UserCreateOrConnectWithoutEducationsInput;

    @Field(() => UserUpsertWithoutEducationsInput, {nullable:true})
    @Type(() => UserUpsertWithoutEducationsInput)
    upsert?: UserUpsertWithoutEducationsInput;

    @Field(() => UserWhereUniqueInput, {nullable:true})
    @Type(() => UserWhereUniqueInput)
    connect?: Prisma.AtLeast<UserWhereUniqueInput, 'id' | 'email' | 'firstName' | 'lastName' | 'linkedin' | 'github'>;

    @Field(() => UserUpdateToOneWithWhereWithoutEducationsInput, {nullable:true})
    @Type(() => UserUpdateToOneWithWhereWithoutEducationsInput)
    update?: UserUpdateToOneWithWhereWithoutEducationsInput;
}
