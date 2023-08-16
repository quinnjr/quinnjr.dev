import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { Int } from '@nestjs/graphql';
import { UserCreateNestedOneWithoutExperiencesInput } from '../user/user-create-nested-one-without-experiences.input';

@InputType()
export class ExperienceCreateInput {

    @Field(() => String, {nullable:true})
    id?: string;

    @Field(() => String, {nullable:false})
    employer!: string;

    @Field(() => String, {nullable:false})
    title!: string;

    @Field(() => String, {nullable:false})
    location!: string;

    @Field(() => Int, {nullable:false})
    startYear!: number;

    @Field(() => Int, {nullable:true})
    endYear?: number;

    @Field(() => String, {nullable:false})
    description!: string;

    @Field(() => Date, {nullable:true})
    createdAt?: Date | string;

    @Field(() => Date, {nullable:true})
    updatedAt?: Date | string;

    @Field(() => UserCreateNestedOneWithoutExperiencesInput, {nullable:false})
    user!: UserCreateNestedOneWithoutExperiencesInput;
}
