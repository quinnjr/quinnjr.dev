import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { ExperienceWhereInput } from './experience-where.input';
import { Type } from 'class-transformer';
import { ExperienceOrderByWithAggregationInput } from './experience-order-by-with-aggregation.input';
import { ExperienceScalarFieldEnum } from './experience-scalar-field.enum';
import { ExperienceScalarWhereWithAggregatesInput } from './experience-scalar-where-with-aggregates.input';
import { Int } from '@nestjs/graphql';
import { ExperienceCountAggregateInput } from './experience-count-aggregate.input';
import { ExperienceAvgAggregateInput } from './experience-avg-aggregate.input';
import { ExperienceSumAggregateInput } from './experience-sum-aggregate.input';
import { ExperienceMinAggregateInput } from './experience-min-aggregate.input';
import { ExperienceMaxAggregateInput } from './experience-max-aggregate.input';

@ArgsType()
export class ExperienceGroupByArgs {

    @Field(() => ExperienceWhereInput, {nullable:true})
    @Type(() => ExperienceWhereInput)
    where?: ExperienceWhereInput;

    @Field(() => [ExperienceOrderByWithAggregationInput], {nullable:true})
    orderBy?: Array<ExperienceOrderByWithAggregationInput>;

    @Field(() => [ExperienceScalarFieldEnum], {nullable:false})
    by!: Array<keyof typeof ExperienceScalarFieldEnum>;

    @Field(() => ExperienceScalarWhereWithAggregatesInput, {nullable:true})
    having?: ExperienceScalarWhereWithAggregatesInput;

    @Field(() => Int, {nullable:true})
    take?: number;

    @Field(() => Int, {nullable:true})
    skip?: number;

    @Field(() => ExperienceCountAggregateInput, {nullable:true})
    _count?: ExperienceCountAggregateInput;

    @Field(() => ExperienceAvgAggregateInput, {nullable:true})
    _avg?: ExperienceAvgAggregateInput;

    @Field(() => ExperienceSumAggregateInput, {nullable:true})
    _sum?: ExperienceSumAggregateInput;

    @Field(() => ExperienceMinAggregateInput, {nullable:true})
    _min?: ExperienceMinAggregateInput;

    @Field(() => ExperienceMaxAggregateInput, {nullable:true})
    _max?: ExperienceMaxAggregateInput;
}
