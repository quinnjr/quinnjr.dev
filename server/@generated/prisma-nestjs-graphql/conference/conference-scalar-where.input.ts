import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UuidFilter } from '../prisma/uuid-filter.input';
import { StringFilter } from '../prisma/string-filter.input';
import { DateTimeFilter } from '../prisma/date-time-filter.input';

@InputType()
export class ConferenceScalarWhereInput {

    @Field(() => [ConferenceScalarWhereInput], {nullable:true})
    AND?: Array<ConferenceScalarWhereInput>;

    @Field(() => [ConferenceScalarWhereInput], {nullable:true})
    OR?: Array<ConferenceScalarWhereInput>;

    @Field(() => [ConferenceScalarWhereInput], {nullable:true})
    NOT?: Array<ConferenceScalarWhereInput>;

    @Field(() => UuidFilter, {nullable:true})
    id?: UuidFilter;

    @Field(() => StringFilter, {nullable:true})
    name?: StringFilter;

    @Field(() => DateTimeFilter, {nullable:true})
    startDate?: DateTimeFilter;

    @Field(() => DateTimeFilter, {nullable:true})
    endDate?: DateTimeFilter;

    @Field(() => UuidFilter, {nullable:true})
    userId?: UuidFilter;
}
