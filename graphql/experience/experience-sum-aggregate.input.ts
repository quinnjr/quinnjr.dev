import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';

@InputType()
export class ExperienceSumAggregateInput {

    @Field(() => Boolean, {nullable:true})
    startYear?: true;

    @Field(() => Boolean, {nullable:true})
    endYear?: true;
}
