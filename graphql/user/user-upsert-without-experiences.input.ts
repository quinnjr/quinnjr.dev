import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UserUpdateWithoutExperiencesInput } from './user-update-without-experiences.input';
import { Type } from 'class-transformer';
import { UserCreateWithoutExperiencesInput } from './user-create-without-experiences.input';
import { UserWhereInput } from './user-where.input';

@InputType()
export class UserUpsertWithoutExperiencesInput {

    @Field(() => UserUpdateWithoutExperiencesInput, {nullable:false})
    @Type(() => UserUpdateWithoutExperiencesInput)
    update!: UserUpdateWithoutExperiencesInput;

    @Field(() => UserCreateWithoutExperiencesInput, {nullable:false})
    @Type(() => UserCreateWithoutExperiencesInput)
    create!: UserCreateWithoutExperiencesInput;

    @Field(() => UserWhereInput, {nullable:true})
    @Type(() => UserWhereInput)
    where?: UserWhereInput;
}
