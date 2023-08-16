import { registerEnumType } from '@nestjs/graphql';

export enum ArticleScalarFieldEnum {
    id = "id",
    title = "title",
    titleSlug = "titleSlug",
    authorId = "authorId",
    content = "content",
    description = "description",
    createdAt = "createdAt",
    updatedAt = "updatedAt"
}


registerEnumType(ArticleScalarFieldEnum, { name: 'ArticleScalarFieldEnum', description: undefined })
