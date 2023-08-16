import { registerEnumType } from '@nestjs/graphql';

export enum ExperienceScalarFieldEnum {
    id = "id",
    employer = "employer",
    title = "title",
    location = "location",
    startYear = "startYear",
    endYear = "endYear",
    description = "description",
    createdAt = "createdAt",
    updatedAt = "updatedAt",
    userId = "userId"
}


registerEnumType(ExperienceScalarFieldEnum, { name: 'ExperienceScalarFieldEnum', description: undefined })
