import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UserCreateWithoutExperiencesInput } from './user-create-without-experiences.input';
import { UserCreateOrConnectWithoutExperiencesInput } from './user-create-or-connect-without-experiences.input';
import { UserUpsertWithoutExperiencesInput } from './user-upsert-without-experiences.input';
import { UserWhereUniqueInput } from './user-where-unique.input';
import { UserUpdateWithoutExperiencesInput } from './user-update-without-experiences.input';

@InputType()
export class UserUpdateOneRequiredWithoutExperiencesNestedInput {

    @Field(() => UserCreateWithoutExperiencesInput, {nullable:true})
    create?: UserCreateWithoutExperiencesInput;

    @Field(() => UserCreateOrConnectWithoutExperiencesInput, {nullable:true})
    connectOrCreate?: UserCreateOrConnectWithoutExperiencesInput;

    @Field(() => UserUpsertWithoutExperiencesInput, {nullable:true})
    upsert?: UserUpsertWithoutExperiencesInput;

    @Field(() => UserWhereUniqueInput, {nullable:true})
    connect?: UserWhereUniqueInput;

    @Field(() => UserUpdateWithoutExperiencesInput, {nullable:true})
    update?: UserUpdateWithoutExperiencesInput;
}
