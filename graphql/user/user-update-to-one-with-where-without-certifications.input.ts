import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UserWhereInput } from './user-where.input';
import { Type } from 'class-transformer';
import { UserUpdateWithoutCertificationsInput } from './user-update-without-certifications.input';

@InputType()
export class UserUpdateToOneWithWhereWithoutCertificationsInput {

    @Field(() => UserWhereInput, {nullable:true})
    @Type(() => UserWhereInput)
    where?: UserWhereInput;

    @Field(() => UserUpdateWithoutCertificationsInput, {nullable:false})
    @Type(() => UserUpdateWithoutCertificationsInput)
    data!: UserUpdateWithoutCertificationsInput;
}
