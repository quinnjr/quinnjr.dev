import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UserCreateWithoutExperiencesInput } from './user-create-without-experiences.input';
import { Type } from 'class-transformer';
import { UserCreateOrConnectWithoutExperiencesInput } from './user-create-or-connect-without-experiences.input';
import { Prisma } from '@prisma/client';
import { UserWhereUniqueInput } from './user-where-unique.input';

@InputType()
export class UserCreateNestedOneWithoutExperiencesInput {

    @Field(() => UserCreateWithoutExperiencesInput, {nullable:true})
    @Type(() => UserCreateWithoutExperiencesInput)
    create?: UserCreateWithoutExperiencesInput;

    @Field(() => UserCreateOrConnectWithoutExperiencesInput, {nullable:true})
    @Type(() => UserCreateOrConnectWithoutExperiencesInput)
    connectOrCreate?: UserCreateOrConnectWithoutExperiencesInput;

    @Field(() => UserWhereUniqueInput, {nullable:true})
    @Type(() => UserWhereUniqueInput)
    connect?: Prisma.AtLeast<UserWhereUniqueInput, 'id' | 'email' | 'firstName' | 'lastName' | 'linkedin' | 'github'>;
}
