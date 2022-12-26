import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { ArticleWhereUniqueInput } from '../article/article-where-unique.input';

@ArgsType()
export class FindUniqueArticleOrThrowArgs {

    @Field(() => ArticleWhereUniqueInput, {nullable:false})
    where!: ArticleWhereUniqueInput;
}
