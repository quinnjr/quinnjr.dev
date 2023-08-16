import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { ProjectWhereInput } from './project-where.input';
import { StringFilter } from '../prisma/string-filter.input';
import { UuidFilter } from '../prisma/uuid-filter.input';
import { UserRelationFilter } from '../user/user-relation-filter.input';

@InputType()
export class ProjectWhereUniqueInput {

    @Field(() => String, {nullable:true})
    id?: string;

    @Field(() => String, {nullable:true})
    name?: string;

    @Field(() => [ProjectWhereInput], {nullable:true})
    AND?: Array<ProjectWhereInput>;

    @Field(() => [ProjectWhereInput], {nullable:true})
    OR?: Array<ProjectWhereInput>;

    @Field(() => [ProjectWhereInput], {nullable:true})
    NOT?: Array<ProjectWhereInput>;

    @Field(() => StringFilter, {nullable:true})
    url?: StringFilter;

    @Field(() => StringFilter, {nullable:true})
    content?: StringFilter;

    @Field(() => StringFilter, {nullable:true})
    description?: StringFilter;

    @Field(() => UuidFilter, {nullable:true})
    userId?: UuidFilter;

    @Field(() => UserRelationFilter, {nullable:true})
    user?: UserRelationFilter;
}
