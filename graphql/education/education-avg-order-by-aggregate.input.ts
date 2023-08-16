import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { SortOrder } from '../prisma/sort-order.enum';

@InputType()
export class EducationAvgOrderByAggregateInput {

    @Field(() => SortOrder, {nullable:true})
    graduationYear?: keyof typeof SortOrder;
}
