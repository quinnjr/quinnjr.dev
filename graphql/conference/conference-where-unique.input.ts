import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { ConferenceWhereInput } from './conference-where.input';
import { DateTimeFilter } from '../prisma/date-time-filter.input';
import { UuidFilter } from '../prisma/uuid-filter.input';
import { UserRelationFilter } from '../user/user-relation-filter.input';

@InputType()
export class ConferenceWhereUniqueInput {

    @Field(() => String, {nullable:true})
    id?: string;

    @Field(() => String, {nullable:true})
    name?: string;

    @Field(() => [ConferenceWhereInput], {nullable:true})
    AND?: Array<ConferenceWhereInput>;

    @Field(() => [ConferenceWhereInput], {nullable:true})
    OR?: Array<ConferenceWhereInput>;

    @Field(() => [ConferenceWhereInput], {nullable:true})
    NOT?: Array<ConferenceWhereInput>;

    @Field(() => DateTimeFilter, {nullable:true})
    startDate?: DateTimeFilter;

    @Field(() => DateTimeFilter, {nullable:true})
    endDate?: DateTimeFilter;

    @Field(() => UuidFilter, {nullable:true})
    userId?: UuidFilter;

    @Field(() => UserRelationFilter, {nullable:true})
    user?: UserRelationFilter;
}
