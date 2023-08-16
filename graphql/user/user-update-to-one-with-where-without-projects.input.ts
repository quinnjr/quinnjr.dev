import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UserWhereInput } from './user-where.input';
import { Type } from 'class-transformer';
import { UserUpdateWithoutProjectsInput } from './user-update-without-projects.input';

@InputType()
export class UserUpdateToOneWithWhereWithoutProjectsInput {

    @Field(() => UserWhereInput, {nullable:true})
    @Type(() => UserWhereInput)
    where?: UserWhereInput;

    @Field(() => UserUpdateWithoutProjectsInput, {nullable:false})
    @Type(() => UserUpdateWithoutProjectsInput)
    data!: UserUpdateWithoutProjectsInput;
}
