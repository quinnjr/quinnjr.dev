import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UuidFilter } from '../prisma/uuid-filter.input';
import { StringFilter } from '../prisma/string-filter.input';
import { UserRelationFilter } from '../user/user-relation-filter.input';

@InputType()
export class ProjectWhereInput {

    @Field(() => [ProjectWhereInput], {nullable:true})
    AND?: Array<ProjectWhereInput>;

    @Field(() => [ProjectWhereInput], {nullable:true})
    OR?: Array<ProjectWhereInput>;

    @Field(() => [ProjectWhereInput], {nullable:true})
    NOT?: Array<ProjectWhereInput>;

    @Field(() => UuidFilter, {nullable:true})
    id?: UuidFilter;

    @Field(() => StringFilter, {nullable:true})
    name?: StringFilter;

    @Field(() => StringFilter, {nullable:true})
    url?: StringFilter;

    @Field(() => StringFilter, {nullable:true})
    content?: StringFilter;

    @Field(() => StringFilter, {nullable:true})
    description?: StringFilter;

    @Field(() => UserRelationFilter, {nullable:true})
    user?: UserRelationFilter;

    @Field(() => UuidFilter, {nullable:true})
    userId?: UuidFilter;
}
