import { registerEnumType } from '@nestjs/graphql';

export enum ConferenceScalarFieldEnum {
    id = "id",
    name = "name",
    startDate = "startDate",
    endDate = "endDate",
    userId = "userId"
}


registerEnumType(ConferenceScalarFieldEnum, { name: 'ConferenceScalarFieldEnum', description: undefined })
