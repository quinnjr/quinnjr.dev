import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';

@InputType()
export class EducationMinAggregateInput {

    @Field(() => Boolean, {nullable:true})
    id?: true;

    @Field(() => Boolean, {nullable:true})
    name?: true;

    @Field(() => Boolean, {nullable:true})
    location?: true;

    @Field(() => Boolean, {nullable:true})
    degree?: true;

    @Field(() => Boolean, {nullable:true})
    startYear?: true;

    @Field(() => Boolean, {nullable:true})
    graduationYear?: true;

    @Field(() => Boolean, {nullable:true})
    campusImage?: true;

    @Field(() => Boolean, {nullable:true})
    url?: true;

    @Field(() => Boolean, {nullable:true})
    userId?: true;
}
