import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';

@InputType()
export class ConferenceMaxAggregateInput {

    @Field(() => Boolean, {nullable:true})
    id?: true;

    @Field(() => Boolean, {nullable:true})
    name?: true;

    @Field(() => Boolean, {nullable:true})
    startDate?: true;

    @Field(() => Boolean, {nullable:true})
    endDate?: true;

    @Field(() => Boolean, {nullable:true})
    userId?: true;
}
