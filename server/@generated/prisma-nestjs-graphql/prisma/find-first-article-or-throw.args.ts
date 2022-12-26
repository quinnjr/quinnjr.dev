import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { ArticleWhereInput } from '../article/article-where.input';
import { ArticleOrderByWithRelationInput } from '../article/article-order-by-with-relation.input';
import { ArticleWhereUniqueInput } from '../article/article-where-unique.input';
import { Int } from '@nestjs/graphql';
import { ArticleScalarFieldEnum } from '../article/article-scalar-field.enum';

@ArgsType()
export class FindFirstArticleOrThrowArgs {

    @Field(() => ArticleWhereInput, {nullable:true})
    where?: ArticleWhereInput;

    @Field(() => [ArticleOrderByWithRelationInput], {nullable:true})
    orderBy?: Array<ArticleOrderByWithRelationInput>;

    @Field(() => ArticleWhereUniqueInput, {nullable:true})
    cursor?: ArticleWhereUniqueInput;

    @Field(() => Int, {nullable:true})
    take?: number;

    @Field(() => Int, {nullable:true})
    skip?: number;

    @Field(() => [ArticleScalarFieldEnum], {nullable:true})
    distinct?: Array<keyof typeof ArticleScalarFieldEnum>;
}
