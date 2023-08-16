import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UserCreateNestedOneWithoutConferencesInput } from '../user/user-create-nested-one-without-conferences.input';

@InputType()
export class ConferenceCreateInput {

    @Field(() => String, {nullable:true})
    id?: string;

    @Field(() => String, {nullable:false})
    name!: string;

    @Field(() => Date, {nullable:false})
    startDate!: Date | string;

    @Field(() => Date, {nullable:false})
    endDate!: Date | string;

    @Field(() => UserCreateNestedOneWithoutConferencesInput, {nullable:false})
    user!: UserCreateNestedOneWithoutConferencesInput;
}
