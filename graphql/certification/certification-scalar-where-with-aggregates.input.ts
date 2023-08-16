import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UuidWithAggregatesFilter } from '../prisma/uuid-with-aggregates-filter.input';
import { StringWithAggregatesFilter } from '../prisma/string-with-aggregates-filter.input';

@InputType()
export class CertificationScalarWhereWithAggregatesInput {

    @Field(() => [CertificationScalarWhereWithAggregatesInput], {nullable:true})
    AND?: Array<CertificationScalarWhereWithAggregatesInput>;

    @Field(() => [CertificationScalarWhereWithAggregatesInput], {nullable:true})
    OR?: Array<CertificationScalarWhereWithAggregatesInput>;

    @Field(() => [CertificationScalarWhereWithAggregatesInput], {nullable:true})
    NOT?: Array<CertificationScalarWhereWithAggregatesInput>;

    @Field(() => UuidWithAggregatesFilter, {nullable:true})
    id?: UuidWithAggregatesFilter;

    @Field(() => StringWithAggregatesFilter, {nullable:true})
    name?: StringWithAggregatesFilter;

    @Field(() => StringWithAggregatesFilter, {nullable:true})
    certifier?: StringWithAggregatesFilter;

    @Field(() => UuidWithAggregatesFilter, {nullable:true})
    userId?: UuidWithAggregatesFilter;
}
