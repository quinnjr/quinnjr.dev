import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';

@InputType()
export class EducationAvgAggregateInput {

    @Field(() => Boolean, {nullable:true})
    graduationYear?: true;
}
