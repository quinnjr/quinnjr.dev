import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UuidWithAggregatesFilter } from '../prisma/uuid-with-aggregates-filter.input';
import { StringWithAggregatesFilter } from '../prisma/string-with-aggregates-filter.input';
import { DateTimeNullableWithAggregatesFilter } from '../prisma/date-time-nullable-with-aggregates-filter.input';
import { IntNullableWithAggregatesFilter } from '../prisma/int-nullable-with-aggregates-filter.input';
import { StringNullableListFilter } from '../prisma/string-nullable-list-filter.input';

@InputType()
export class EducationScalarWhereWithAggregatesInput {

    @Field(() => [EducationScalarWhereWithAggregatesInput], {nullable:true})
    AND?: Array<EducationScalarWhereWithAggregatesInput>;

    @Field(() => [EducationScalarWhereWithAggregatesInput], {nullable:true})
    OR?: Array<EducationScalarWhereWithAggregatesInput>;

    @Field(() => [EducationScalarWhereWithAggregatesInput], {nullable:true})
    NOT?: Array<EducationScalarWhereWithAggregatesInput>;

    @Field(() => UuidWithAggregatesFilter, {nullable:true})
    id?: UuidWithAggregatesFilter;

    @Field(() => StringWithAggregatesFilter, {nullable:true})
    name?: StringWithAggregatesFilter;

    @Field(() => StringWithAggregatesFilter, {nullable:true})
    location?: StringWithAggregatesFilter;

    @Field(() => StringWithAggregatesFilter, {nullable:true})
    degree?: StringWithAggregatesFilter;

    @Field(() => DateTimeNullableWithAggregatesFilter, {nullable:true})
    startYear?: DateTimeNullableWithAggregatesFilter;

    @Field(() => IntNullableWithAggregatesFilter, {nullable:true})
    graduationYear?: IntNullableWithAggregatesFilter;

    @Field(() => StringNullableListFilter, {nullable:true})
    activities?: StringNullableListFilter;

    @Field(() => StringWithAggregatesFilter, {nullable:true})
    campusImage?: StringWithAggregatesFilter;

    @Field(() => StringWithAggregatesFilter, {nullable:true})
    url?: StringWithAggregatesFilter;

    @Field(() => UuidWithAggregatesFilter, {nullable:true})
    userId?: UuidWithAggregatesFilter;
}
