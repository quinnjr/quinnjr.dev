import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { SortOrder } from '../prisma/sort-order.enum';
import { SortOrderInput } from '../prisma/sort-order.input';
import { EducationCountOrderByAggregateInput } from './education-count-order-by-aggregate.input';
import { EducationAvgOrderByAggregateInput } from './education-avg-order-by-aggregate.input';
import { EducationMaxOrderByAggregateInput } from './education-max-order-by-aggregate.input';
import { EducationMinOrderByAggregateInput } from './education-min-order-by-aggregate.input';
import { EducationSumOrderByAggregateInput } from './education-sum-order-by-aggregate.input';

@InputType()
export class EducationOrderByWithAggregationInput {

    @Field(() => SortOrder, {nullable:true})
    id?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    name?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    location?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    degree?: keyof typeof SortOrder;

    @Field(() => SortOrderInput, {nullable:true})
    startYear?: SortOrderInput;

    @Field(() => SortOrderInput, {nullable:true})
    graduationYear?: SortOrderInput;

    @Field(() => SortOrder, {nullable:true})
    activities?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    campusImage?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    url?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    userId?: keyof typeof SortOrder;

    @Field(() => EducationCountOrderByAggregateInput, {nullable:true})
    _count?: EducationCountOrderByAggregateInput;

    @Field(() => EducationAvgOrderByAggregateInput, {nullable:true})
    _avg?: EducationAvgOrderByAggregateInput;

    @Field(() => EducationMaxOrderByAggregateInput, {nullable:true})
    _max?: EducationMaxOrderByAggregateInput;

    @Field(() => EducationMinOrderByAggregateInput, {nullable:true})
    _min?: EducationMinOrderByAggregateInput;

    @Field(() => EducationSumOrderByAggregateInput, {nullable:true})
    _sum?: EducationSumOrderByAggregateInput;
}
