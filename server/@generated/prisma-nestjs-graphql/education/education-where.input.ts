import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UuidFilter } from '../prisma/uuid-filter.input';
import { StringFilter } from '../prisma/string-filter.input';
import { DateTimeNullableFilter } from '../prisma/date-time-nullable-filter.input';
import { IntNullableFilter } from '../prisma/int-nullable-filter.input';
import { StringNullableListFilter } from '../prisma/string-nullable-list-filter.input';
import { UserRelationFilter } from '../user/user-relation-filter.input';

@InputType()
export class EducationWhereInput {

    @Field(() => [EducationWhereInput], {nullable:true})
    AND?: Array<EducationWhereInput>;

    @Field(() => [EducationWhereInput], {nullable:true})
    OR?: Array<EducationWhereInput>;

    @Field(() => [EducationWhereInput], {nullable:true})
    NOT?: Array<EducationWhereInput>;

    @Field(() => UuidFilter, {nullable:true})
    id?: UuidFilter;

    @Field(() => StringFilter, {nullable:true})
    name?: StringFilter;

    @Field(() => StringFilter, {nullable:true})
    location?: StringFilter;

    @Field(() => StringFilter, {nullable:true})
    degree?: StringFilter;

    @Field(() => DateTimeNullableFilter, {nullable:true})
    startYear?: DateTimeNullableFilter;

    @Field(() => IntNullableFilter, {nullable:true})
    graduationYear?: IntNullableFilter;

    @Field(() => StringNullableListFilter, {nullable:true})
    activities?: StringNullableListFilter;

    @Field(() => StringFilter, {nullable:true})
    campusImage?: StringFilter;

    @Field(() => StringFilter, {nullable:true})
    url?: StringFilter;

    @Field(() => UserRelationFilter, {nullable:true})
    user?: UserRelationFilter;

    @Field(() => UuidFilter, {nullable:true})
    userId?: UuidFilter;
}
