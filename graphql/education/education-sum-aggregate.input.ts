import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';

@InputType()
export class EducationSumAggregateInput {

    @Field(() => Boolean, {nullable:true})
    graduationYear?: true;
}
