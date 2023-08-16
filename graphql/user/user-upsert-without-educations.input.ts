import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UserUpdateWithoutEducationsInput } from './user-update-without-educations.input';
import { Type } from 'class-transformer';
import { UserCreateWithoutEducationsInput } from './user-create-without-educations.input';
import { UserWhereInput } from './user-where.input';

@InputType()
export class UserUpsertWithoutEducationsInput {

    @Field(() => UserUpdateWithoutEducationsInput, {nullable:false})
    @Type(() => UserUpdateWithoutEducationsInput)
    update!: UserUpdateWithoutEducationsInput;

    @Field(() => UserCreateWithoutEducationsInput, {nullable:false})
    @Type(() => UserCreateWithoutEducationsInput)
    create!: UserCreateWithoutEducationsInput;

    @Field(() => UserWhereInput, {nullable:true})
    @Type(() => UserWhereInput)
    where?: UserWhereInput;
}
