import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UuidFilter } from '../prisma/uuid-filter.input';
import { StringFilter } from '../prisma/string-filter.input';
import { DateTimeFilter } from '../prisma/date-time-filter.input';

@InputType()
export class ArticleScalarWhereInput {

    @Field(() => [ArticleScalarWhereInput], {nullable:true})
    AND?: Array<ArticleScalarWhereInput>;

    @Field(() => [ArticleScalarWhereInput], {nullable:true})
    OR?: Array<ArticleScalarWhereInput>;

    @Field(() => [ArticleScalarWhereInput], {nullable:true})
    NOT?: Array<ArticleScalarWhereInput>;

    @Field(() => UuidFilter, {nullable:true})
    id?: UuidFilter;

    @Field(() => StringFilter, {nullable:true})
    title?: StringFilter;

    @Field(() => StringFilter, {nullable:true})
    titleSlug?: StringFilter;

    @Field(() => UuidFilter, {nullable:true})
    authorId?: UuidFilter;

    @Field(() => StringFilter, {nullable:true})
    content?: StringFilter;

    @Field(() => StringFilter, {nullable:true})
    description?: StringFilter;

    @Field(() => DateTimeFilter, {nullable:true})
    createdAt?: DateTimeFilter;

    @Field(() => DateTimeFilter, {nullable:true})
    updatedAt?: DateTimeFilter;
}
