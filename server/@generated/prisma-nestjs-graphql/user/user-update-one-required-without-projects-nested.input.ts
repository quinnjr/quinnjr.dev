import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UserCreateWithoutProjectsInput } from './user-create-without-projects.input';
import { UserCreateOrConnectWithoutProjectsInput } from './user-create-or-connect-without-projects.input';
import { UserUpsertWithoutProjectsInput } from './user-upsert-without-projects.input';
import { UserWhereUniqueInput } from './user-where-unique.input';
import { UserUpdateWithoutProjectsInput } from './user-update-without-projects.input';

@InputType()
export class UserUpdateOneRequiredWithoutProjectsNestedInput {

    @Field(() => UserCreateWithoutProjectsInput, {nullable:true})
    create?: UserCreateWithoutProjectsInput;

    @Field(() => UserCreateOrConnectWithoutProjectsInput, {nullable:true})
    connectOrCreate?: UserCreateOrConnectWithoutProjectsInput;

    @Field(() => UserUpsertWithoutProjectsInput, {nullable:true})
    upsert?: UserUpsertWithoutProjectsInput;

    @Field(() => UserWhereUniqueInput, {nullable:true})
    connect?: UserWhereUniqueInput;

    @Field(() => UserUpdateWithoutProjectsInput, {nullable:true})
    update?: UserUpdateWithoutProjectsInput;
}
