import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UserWhereInput } from './user-where.input';
import { Type } from 'class-transformer';
import { UserUpdateWithoutEducationsInput } from './user-update-without-educations.input';

@InputType()
export class UserUpdateToOneWithWhereWithoutEducationsInput {

    @Field(() => UserWhereInput, {nullable:true})
    @Type(() => UserWhereInput)
    where?: UserWhereInput;

    @Field(() => UserUpdateWithoutEducationsInput, {nullable:false})
    @Type(() => UserUpdateWithoutEducationsInput)
    data!: UserUpdateWithoutEducationsInput;
}
