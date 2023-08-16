import { Field } from '@nestjs/graphql';
import { ObjectType } from '@nestjs/graphql';
import { EducationCountAggregate } from './education-count-aggregate.output';
import { EducationAvgAggregate } from './education-avg-aggregate.output';
import { EducationSumAggregate } from './education-sum-aggregate.output';
import { EducationMinAggregate } from './education-min-aggregate.output';
import { EducationMaxAggregate } from './education-max-aggregate.output';

@ObjectType()
export class AggregateEducation {

    @Field(() => EducationCountAggregate, {nullable:true})
    _count?: EducationCountAggregate;

    @Field(() => EducationAvgAggregate, {nullable:true})
    _avg?: EducationAvgAggregate;

    @Field(() => EducationSumAggregate, {nullable:true})
    _sum?: EducationSumAggregate;

    @Field(() => EducationMinAggregate, {nullable:true})
    _min?: EducationMinAggregate;

    @Field(() => EducationMaxAggregate, {nullable:true})
    _max?: EducationMaxAggregate;
}
