import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { SortOrder } from '../prisma/sort-order.enum';
import { ArticleCountOrderByAggregateInput } from './article-count-order-by-aggregate.input';
import { ArticleMaxOrderByAggregateInput } from './article-max-order-by-aggregate.input';
import { ArticleMinOrderByAggregateInput } from './article-min-order-by-aggregate.input';

@InputType()
export class ArticleOrderByWithAggregationInput {

    @Field(() => SortOrder, {nullable:true})
    id?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    title?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    titleSlug?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    authorId?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    content?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    description?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    createdAt?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    updatedAt?: keyof typeof SortOrder;

    @Field(() => ArticleCountOrderByAggregateInput, {nullable:true})
    _count?: ArticleCountOrderByAggregateInput;

    @Field(() => ArticleMaxOrderByAggregateInput, {nullable:true})
    _max?: ArticleMaxOrderByAggregateInput;

    @Field(() => ArticleMinOrderByAggregateInput, {nullable:true})
    _min?: ArticleMinOrderByAggregateInput;
}
