import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { SortOrder } from '../prisma/sort-order.enum';
import { CertificationCountOrderByAggregateInput } from './certification-count-order-by-aggregate.input';
import { CertificationMaxOrderByAggregateInput } from './certification-max-order-by-aggregate.input';
import { CertificationMinOrderByAggregateInput } from './certification-min-order-by-aggregate.input';

@InputType()
export class CertificationOrderByWithAggregationInput {

    @Field(() => SortOrder, {nullable:true})
    id?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    name?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    certifier?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    userId?: keyof typeof SortOrder;

    @Field(() => CertificationCountOrderByAggregateInput, {nullable:true})
    _count?: CertificationCountOrderByAggregateInput;

    @Field(() => CertificationMaxOrderByAggregateInput, {nullable:true})
    _max?: CertificationMaxOrderByAggregateInput;

    @Field(() => CertificationMinOrderByAggregateInput, {nullable:true})
    _min?: CertificationMinOrderByAggregateInput;
}
