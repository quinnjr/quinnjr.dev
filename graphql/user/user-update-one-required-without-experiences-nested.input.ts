import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UserCreateWithoutExperiencesInput } from './user-create-without-experiences.input';
import { Type } from 'class-transformer';
import { UserCreateOrConnectWithoutExperiencesInput } from './user-create-or-connect-without-experiences.input';
import { UserUpsertWithoutExperiencesInput } from './user-upsert-without-experiences.input';
import { Prisma } from '@prisma/client';
import { UserWhereUniqueInput } from './user-where-unique.input';
import { UserUpdateToOneWithWhereWithoutExperiencesInput } from './user-update-to-one-with-where-without-experiences.input';

@InputType()
export class UserUpdateOneRequiredWithoutExperiencesNestedInput {

    @Field(() => UserCreateWithoutExperiencesInput, {nullable:true})
    @Type(() => UserCreateWithoutExperiencesInput)
    create?: UserCreateWithoutExperiencesInput;

    @Field(() => UserCreateOrConnectWithoutExperiencesInput, {nullable:true})
    @Type(() => UserCreateOrConnectWithoutExperiencesInput)
    connectOrCreate?: UserCreateOrConnectWithoutExperiencesInput;

    @Field(() => UserUpsertWithoutExperiencesInput, {nullable:true})
    @Type(() => UserUpsertWithoutExperiencesInput)
    upsert?: UserUpsertWithoutExperiencesInput;

    @Field(() => UserWhereUniqueInput, {nullable:true})
    @Type(() => UserWhereUniqueInput)
    connect?: Prisma.AtLeast<UserWhereUniqueInput, 'id' | 'email' | 'firstName' | 'lastName' | 'linkedin' | 'github'>;

    @Field(() => UserUpdateToOneWithWhereWithoutExperiencesInput, {nullable:true})
    @Type(() => UserUpdateToOneWithWhereWithoutExperiencesInput)
    update?: UserUpdateToOneWithWhereWithoutExperiencesInput;
}
