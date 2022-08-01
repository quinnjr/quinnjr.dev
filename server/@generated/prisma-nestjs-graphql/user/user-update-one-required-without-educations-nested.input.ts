import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UserCreateWithoutEducationsInput } from './user-create-without-educations.input';
import { UserCreateOrConnectWithoutEducationsInput } from './user-create-or-connect-without-educations.input';
import { UserUpsertWithoutEducationsInput } from './user-upsert-without-educations.input';
import { UserWhereUniqueInput } from './user-where-unique.input';
import { UserUpdateWithoutEducationsInput } from './user-update-without-educations.input';

@InputType()
export class UserUpdateOneRequiredWithoutEducationsNestedInput {

    @Field(() => UserCreateWithoutEducationsInput, {nullable:true})
    create?: UserCreateWithoutEducationsInput;

    @Field(() => UserCreateOrConnectWithoutEducationsInput, {nullable:true})
    connectOrCreate?: UserCreateOrConnectWithoutEducationsInput;

    @Field(() => UserUpsertWithoutEducationsInput, {nullable:true})
    upsert?: UserUpsertWithoutEducationsInput;

    @Field(() => UserWhereUniqueInput, {nullable:true})
    connect?: UserWhereUniqueInput;

    @Field(() => UserUpdateWithoutEducationsInput, {nullable:true})
    update?: UserUpdateWithoutEducationsInput;
}
