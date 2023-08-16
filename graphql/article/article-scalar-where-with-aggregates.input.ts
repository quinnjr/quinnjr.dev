import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UuidWithAggregatesFilter } from '../prisma/uuid-with-aggregates-filter.input';
import { StringWithAggregatesFilter } from '../prisma/string-with-aggregates-filter.input';
import { DateTimeWithAggregatesFilter } from '../prisma/date-time-with-aggregates-filter.input';

@InputType()
export class ArticleScalarWhereWithAggregatesInput {

    @Field(() => [ArticleScalarWhereWithAggregatesInput], {nullable:true})
    AND?: Array<ArticleScalarWhereWithAggregatesInput>;

    @Field(() => [ArticleScalarWhereWithAggregatesInput], {nullable:true})
    OR?: Array<ArticleScalarWhereWithAggregatesInput>;

    @Field(() => [ArticleScalarWhereWithAggregatesInput], {nullable:true})
    NOT?: Array<ArticleScalarWhereWithAggregatesInput>;

    @Field(() => UuidWithAggregatesFilter, {nullable:true})
    id?: UuidWithAggregatesFilter;

    @Field(() => StringWithAggregatesFilter, {nullable:true})
    title?: StringWithAggregatesFilter;

    @Field(() => StringWithAggregatesFilter, {nullable:true})
    titleSlug?: StringWithAggregatesFilter;

    @Field(() => UuidWithAggregatesFilter, {nullable:true})
    authorId?: UuidWithAggregatesFilter;

    @Field(() => StringWithAggregatesFilter, {nullable:true})
    content?: StringWithAggregatesFilter;

    @Field(() => StringWithAggregatesFilter, {nullable:true})
    description?: StringWithAggregatesFilter;

    @Field(() => DateTimeWithAggregatesFilter, {nullable:true})
    createdAt?: DateTimeWithAggregatesFilter;

    @Field(() => DateTimeWithAggregatesFilter, {nullable:true})
    updatedAt?: DateTimeWithAggregatesFilter;
}
