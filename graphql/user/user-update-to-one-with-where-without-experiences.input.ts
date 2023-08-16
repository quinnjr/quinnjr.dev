import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UserWhereInput } from './user-where.input';
import { Type } from 'class-transformer';
import { UserUpdateWithoutExperiencesInput } from './user-update-without-experiences.input';

@InputType()
export class UserUpdateToOneWithWhereWithoutExperiencesInput {

    @Field(() => UserWhereInput, {nullable:true})
    @Type(() => UserWhereInput)
    where?: UserWhereInput;

    @Field(() => UserUpdateWithoutExperiencesInput, {nullable:false})
    @Type(() => UserUpdateWithoutExperiencesInput)
    data!: UserUpdateWithoutExperiencesInput;
}
