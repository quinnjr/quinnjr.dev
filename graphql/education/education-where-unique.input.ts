import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { Int } from '@nestjs/graphql';
import { EducationWhereInput } from './education-where.input';
import { StringFilter } from '../prisma/string-filter.input';
import { DateTimeNullableFilter } from '../prisma/date-time-nullable-filter.input';
import { StringNullableListFilter } from '../prisma/string-nullable-list-filter.input';
import { UuidFilter } from '../prisma/uuid-filter.input';
import { UserRelationFilter } from '../user/user-relation-filter.input';

@InputType()
export class EducationWhereUniqueInput {

    @Field(() => String, {nullable:true})
    id?: string;

    @Field(() => String, {nullable:true})
    name?: string;

    @Field(() => Int, {nullable:true})
    graduationYear?: number;

    @Field(() => [EducationWhereInput], {nullable:true})
    AND?: Array<EducationWhereInput>;

    @Field(() => [EducationWhereInput], {nullable:true})
    OR?: Array<EducationWhereInput>;

    @Field(() => [EducationWhereInput], {nullable:true})
    NOT?: Array<EducationWhereInput>;

    @Field(() => StringFilter, {nullable:true})
    location?: StringFilter;

    @Field(() => StringFilter, {nullable:true})
    degree?: StringFilter;

    @Field(() => DateTimeNullableFilter, {nullable:true})
    startYear?: DateTimeNullableFilter;

    @Field(() => StringNullableListFilter, {nullable:true})
    activities?: StringNullableListFilter;

    @Field(() => StringFilter, {nullable:true})
    campusImage?: StringFilter;

    @Field(() => StringFilter, {nullable:true})
    url?: StringFilter;

    @Field(() => UuidFilter, {nullable:true})
    userId?: UuidFilter;

    @Field(() => UserRelationFilter, {nullable:true})
    user?: UserRelationFilter;
}
