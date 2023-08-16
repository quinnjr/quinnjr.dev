import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { EducationWhereInput } from './education-where.input';
import { Type } from 'class-transformer';
import { EducationOrderByWithAggregationInput } from './education-order-by-with-aggregation.input';
import { EducationScalarFieldEnum } from './education-scalar-field.enum';
import { EducationScalarWhereWithAggregatesInput } from './education-scalar-where-with-aggregates.input';
import { Int } from '@nestjs/graphql';
import { EducationCountAggregateInput } from './education-count-aggregate.input';
import { EducationAvgAggregateInput } from './education-avg-aggregate.input';
import { EducationSumAggregateInput } from './education-sum-aggregate.input';
import { EducationMinAggregateInput } from './education-min-aggregate.input';
import { EducationMaxAggregateInput } from './education-max-aggregate.input';

@ArgsType()
export class EducationGroupByArgs {

    @Field(() => EducationWhereInput, {nullable:true})
    @Type(() => EducationWhereInput)
    where?: EducationWhereInput;

    @Field(() => [EducationOrderByWithAggregationInput], {nullable:true})
    orderBy?: Array<EducationOrderByWithAggregationInput>;

    @Field(() => [EducationScalarFieldEnum], {nullable:false})
    by!: Array<keyof typeof EducationScalarFieldEnum>;

    @Field(() => EducationScalarWhereWithAggregatesInput, {nullable:true})
    having?: EducationScalarWhereWithAggregatesInput;

    @Field(() => Int, {nullable:true})
    take?: number;

    @Field(() => Int, {nullable:true})
    skip?: number;

    @Field(() => EducationCountAggregateInput, {nullable:true})
    _count?: EducationCountAggregateInput;

    @Field(() => EducationAvgAggregateInput, {nullable:true})
    _avg?: EducationAvgAggregateInput;

    @Field(() => EducationSumAggregateInput, {nullable:true})
    _sum?: EducationSumAggregateInput;

    @Field(() => EducationMinAggregateInput, {nullable:true})
    _min?: EducationMinAggregateInput;

    @Field(() => EducationMaxAggregateInput, {nullable:true})
    _max?: EducationMaxAggregateInput;
}
