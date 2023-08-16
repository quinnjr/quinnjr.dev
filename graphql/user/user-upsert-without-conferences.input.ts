import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UserUpdateWithoutConferencesInput } from './user-update-without-conferences.input';
import { Type } from 'class-transformer';
import { UserCreateWithoutConferencesInput } from './user-create-without-conferences.input';
import { UserWhereInput } from './user-where.input';

@InputType()
export class UserUpsertWithoutConferencesInput {

    @Field(() => UserUpdateWithoutConferencesInput, {nullable:false})
    @Type(() => UserUpdateWithoutConferencesInput)
    update!: UserUpdateWithoutConferencesInput;

    @Field(() => UserCreateWithoutConferencesInput, {nullable:false})
    @Type(() => UserCreateWithoutConferencesInput)
    create!: UserCreateWithoutConferencesInput;

    @Field(() => UserWhereInput, {nullable:true})
    @Type(() => UserWhereInput)
    where?: UserWhereInput;
}
