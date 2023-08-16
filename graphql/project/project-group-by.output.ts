import { Field } from '@nestjs/graphql';
import { ObjectType } from '@nestjs/graphql';
import { ProjectCountAggregate } from './project-count-aggregate.output';
import { ProjectMinAggregate } from './project-min-aggregate.output';
import { ProjectMaxAggregate } from './project-max-aggregate.output';

@ObjectType()
export class ProjectGroupBy {

    @Field(() => String, {nullable:false})
    id!: string;

    @Field(() => String, {nullable:false})
    name!: string;

    @Field(() => String, {nullable:false})
    url!: string;

    @Field(() => String, {nullable:false})
    content!: string;

    @Field(() => String, {nullable:false})
    description!: string;

    @Field(() => String, {nullable:false})
    userId!: string;

    @Field(() => ProjectCountAggregate, {nullable:true})
    _count?: ProjectCountAggregate;

    @Field(() => ProjectMinAggregate, {nullable:true})
    _min?: ProjectMinAggregate;

    @Field(() => ProjectMaxAggregate, {nullable:true})
    _max?: ProjectMaxAggregate;
}
