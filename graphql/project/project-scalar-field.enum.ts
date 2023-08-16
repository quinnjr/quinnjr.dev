import { registerEnumType } from '@nestjs/graphql';

export enum ProjectScalarFieldEnum {
    id = "id",
    name = "name",
    url = "url",
    content = "content",
    description = "description",
    userId = "userId"
}


registerEnumType(ProjectScalarFieldEnum, { name: 'ProjectScalarFieldEnum', description: undefined })
