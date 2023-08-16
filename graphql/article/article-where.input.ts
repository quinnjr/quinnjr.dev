import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UuidFilter } from '../prisma/uuid-filter.input';
import { StringFilter } from '../prisma/string-filter.input';
import { DateTimeFilter } from '../prisma/date-time-filter.input';
import { UserRelationFilter } from '../user/user-relation-filter.input';

@InputType()
export class ArticleWhereInput {

    @Field(() => [ArticleWhereInput], {nullable:true})
    AND?: Array<ArticleWhereInput>;

    @Field(() => [ArticleWhereInput], {nullable:true})
    OR?: Array<ArticleWhereInput>;

    @Field(() => [ArticleWhereInput], {nullable:true})
    NOT?: Array<ArticleWhereInput>;

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

    @Field(() => UserRelationFilter, {nullable:true})
    author?: UserRelationFilter;
}
