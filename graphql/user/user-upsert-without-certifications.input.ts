import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UserUpdateWithoutCertificationsInput } from './user-update-without-certifications.input';
import { Type } from 'class-transformer';
import { UserCreateWithoutCertificationsInput } from './user-create-without-certifications.input';
import { UserWhereInput } from './user-where.input';

@InputType()
export class UserUpsertWithoutCertificationsInput {

    @Field(() => UserUpdateWithoutCertificationsInput, {nullable:false})
    @Type(() => UserUpdateWithoutCertificationsInput)
    update!: UserUpdateWithoutCertificationsInput;

    @Field(() => UserCreateWithoutCertificationsInput, {nullable:false})
    @Type(() => UserCreateWithoutCertificationsInput)
    create!: UserCreateWithoutCertificationsInput;

    @Field(() => UserWhereInput, {nullable:true})
    @Type(() => UserWhereInput)
    where?: UserWhereInput;
}
