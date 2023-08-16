import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { SortOrder } from '../prisma/sort-order.enum';
import { ConferenceCountOrderByAggregateInput } from './conference-count-order-by-aggregate.input';
import { ConferenceMaxOrderByAggregateInput } from './conference-max-order-by-aggregate.input';
import { ConferenceMinOrderByAggregateInput } from './conference-min-order-by-aggregate.input';

@InputType()
export class ConferenceOrderByWithAggregationInput {

    @Field(() => SortOrder, {nullable:true})
    id?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    name?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    startDate?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    endDate?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    userId?: keyof typeof SortOrder;

    @Field(() => ConferenceCountOrderByAggregateInput, {nullable:true})
    _count?: ConferenceCountOrderByAggregateInput;

    @Field(() => ConferenceMaxOrderByAggregateInput, {nullable:true})
    _max?: ConferenceMaxOrderByAggregateInput;

    @Field(() => ConferenceMinOrderByAggregateInput, {nullable:true})
    _min?: ConferenceMinOrderByAggregateInput;
}
