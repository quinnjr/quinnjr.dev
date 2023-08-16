import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UuidFilter } from '../prisma/uuid-filter.input';
import { StringFilter } from '../prisma/string-filter.input';

@InputType()
export class CertificationScalarWhereInput {

    @Field(() => [CertificationScalarWhereInput], {nullable:true})
    AND?: Array<CertificationScalarWhereInput>;

    @Field(() => [CertificationScalarWhereInput], {nullable:true})
    OR?: Array<CertificationScalarWhereInput>;

    @Field(() => [CertificationScalarWhereInput], {nullable:true})
    NOT?: Array<CertificationScalarWhereInput>;

    @Field(() => UuidFilter, {nullable:true})
    id?: UuidFilter;

    @Field(() => StringFilter, {nullable:true})
    name?: StringFilter;

    @Field(() => StringFilter, {nullable:true})
    certifier?: StringFilter;

    @Field(() => UuidFilter, {nullable:true})
    userId?: UuidFilter;
}
