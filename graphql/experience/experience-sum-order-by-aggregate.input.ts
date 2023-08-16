import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { SortOrder } from '../prisma/sort-order.enum';

@InputType()
export class ExperienceSumOrderByAggregateInput {

    @Field(() => SortOrder, {nullable:true})
    startYear?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    endYear?: keyof typeof SortOrder;
}
