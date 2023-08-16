import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UserWhereInput } from './user-where.input';
import { Type } from 'class-transformer';
import { UserUpdateWithoutConferencesInput } from './user-update-without-conferences.input';

@InputType()
export class UserUpdateToOneWithWhereWithoutConferencesInput {

    @Field(() => UserWhereInput, {nullable:true})
    @Type(() => UserWhereInput)
    where?: UserWhereInput;

    @Field(() => UserUpdateWithoutConferencesInput, {nullable:false})
    @Type(() => UserUpdateWithoutConferencesInput)
    data!: UserUpdateWithoutConferencesInput;
}
