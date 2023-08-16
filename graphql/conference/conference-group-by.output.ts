import { Field } from '@nestjs/graphql';
import { ObjectType } from '@nestjs/graphql';
import { ConferenceCountAggregate } from './conference-count-aggregate.output';
import { ConferenceMinAggregate } from './conference-min-aggregate.output';
import { ConferenceMaxAggregate } from './conference-max-aggregate.output';

@ObjectType()
export class ConferenceGroupBy {

    @Field(() => String, {nullable:false})
    id!: string;

    @Field(() => String, {nullable:false})
    name!: string;

    @Field(() => Date, {nullable:false})
    startDate!: Date | string;

    @Field(() => Date, {nullable:false})
    endDate!: Date | string;

    @Field(() => String, {nullable:false})
    userId!: string;

    @Field(() => ConferenceCountAggregate, {nullable:true})
    _count?: ConferenceCountAggregate;

    @Field(() => ConferenceMinAggregate, {nullable:true})
    _min?: ConferenceMinAggregate;

    @Field(() => ConferenceMaxAggregate, {nullable:true})
    _max?: ConferenceMaxAggregate;
}
