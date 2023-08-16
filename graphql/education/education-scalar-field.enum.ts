import { registerEnumType } from '@nestjs/graphql';

export enum EducationScalarFieldEnum {
    id = "id",
    name = "name",
    location = "location",
    degree = "degree",
    startYear = "startYear",
    graduationYear = "graduationYear",
    activities = "activities",
    campusImage = "campusImage",
    url = "url",
    userId = "userId"
}


registerEnumType(EducationScalarFieldEnum, { name: 'EducationScalarFieldEnum', description: undefined })
