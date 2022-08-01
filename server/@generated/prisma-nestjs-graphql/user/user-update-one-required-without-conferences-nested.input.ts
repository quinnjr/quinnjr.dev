import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UserCreateWithoutConferencesInput } from './user-create-without-conferences.input';
import { UserCreateOrConnectWithoutConferencesInput } from './user-create-or-connect-without-conferences.input';
import { UserUpsertWithoutConferencesInput } from './user-upsert-without-conferences.input';
import { UserWhereUniqueInput } from './user-where-unique.input';
import { UserUpdateWithoutConferencesInput } from './user-update-without-conferences.input';

@InputType()
export class UserUpdateOneRequiredWithoutConferencesNestedInput {

    @Field(() => UserCreateWithoutConferencesInput, {nullable:true})
    create?: UserCreateWithoutConferencesInput;

    @Field(() => UserCreateOrConnectWithoutConferencesInput, {nullable:true})
    connectOrCreate?: UserCreateOrConnectWithoutConferencesInput;

    @Field(() => UserUpsertWithoutConferencesInput, {nullable:true})
    upsert?: UserUpsertWithoutConferencesInput;

    @Field(() => UserWhereUniqueInput, {nullable:true})
    connect?: UserWhereUniqueInput;

    @Field(() => UserUpdateWithoutConferencesInput, {nullable:true})
    update?: UserUpdateWithoutConferencesInput;
}
