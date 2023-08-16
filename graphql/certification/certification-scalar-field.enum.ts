import { registerEnumType } from '@nestjs/graphql';

export enum CertificationScalarFieldEnum {
    id = "id",
    name = "name",
    certifier = "certifier",
    userId = "userId"
}


registerEnumType(CertificationScalarFieldEnum, { name: 'CertificationScalarFieldEnum', description: undefined })
