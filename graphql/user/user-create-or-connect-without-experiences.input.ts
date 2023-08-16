import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { UserWhereUniqueInput } from './user-where-unique.input';
import { Type } from 'class-transformer';
import { UserCreateWithoutExperiencesInput } from './user-create-without-experiences.input';

@InputType()
export class UserCreateOrConnectWithoutExperiencesInput {

    @Field(() => UserWhereUniqueInput, {nullable:false})
    @Type(() => UserWhereUniqueInput)
    where!: Prisma.AtLeast<UserWhereUniqueInput, 'id' | 'email' | 'firstName' | 'lastName' | 'linkedin' | 'github'>;

    @Field(() => UserCreateWithoutExperiencesInput, {nullable:false})
    @Type(() => UserCreateWithoutExperiencesInput)
    create!: UserCreateWithoutExperiencesInput;
}
