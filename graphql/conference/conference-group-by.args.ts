import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { ConferenceWhereInput } from './conference-where.input';
import { Type } from 'class-transformer';
import { ConferenceOrderByWithAggregationInput } from './conference-order-by-with-aggregation.input';
import { ConferenceScalarFieldEnum } from './conference-scalar-field.enum';
import { ConferenceScalarWhereWithAggregatesInput } from './conference-scalar-where-with-aggregates.input';
import { Int } from '@nestjs/graphql';
import { ConferenceCountAggregateInput } from './conference-count-aggregate.input';
import { ConferenceMinAggregateInput } from './conference-min-aggregate.input';
import { ConferenceMaxAggregateInput } from './conference-max-aggregate.input';

@ArgsType()
export class ConferenceGroupByArgs {

    @Field(() => ConferenceWhereInput, {nullable:true})
    @Type(() => ConferenceWhereInput)
    where?: ConferenceWhereInput;

    @Field(() => [ConferenceOrderByWithAggregationInput], {nullable:true})
    orderBy?: Array<ConferenceOrderByWithAggregationInput>;

    @Field(() => [ConferenceScalarFieldEnum], {nullable:false})
    by!: Array<keyof typeof ConferenceScalarFieldEnum>;

    @Field(() => ConferenceScalarWhereWithAggregatesInput, {nullable:true})
    having?: ConferenceScalarWhereWithAggregatesInput;

    @Field(() => Int, {nullable:true})
    take?: number;

    @Field(() => Int, {nullable:true})
    skip?: number;

    @Field(() => ConferenceCountAggregateInput, {nullable:true})
    _count?: ConferenceCountAggregateInput;

    @Field(() => ConferenceMinAggregateInput, {nullable:true})
    _min?: ConferenceMinAggregateInput;

    @Field(() => ConferenceMaxAggregateInput, {nullable:true})
    _max?: ConferenceMaxAggregateInput;
}
