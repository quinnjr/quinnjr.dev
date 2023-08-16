import { Field } from '@nestjs/graphql';
import { ObjectType } from '@nestjs/graphql';
import { CertificationCountAggregate } from './certification-count-aggregate.output';
import { CertificationMinAggregate } from './certification-min-aggregate.output';
import { CertificationMaxAggregate } from './certification-max-aggregate.output';

@ObjectType()
export class CertificationGroupBy {

    @Field(() => String, {nullable:false})
    id!: string;

    @Field(() => String, {nullable:false})
    name!: string;

    @Field(() => String, {nullable:false})
    certifier!: string;

    @Field(() => String, {nullable:false})
    userId!: string;

    @Field(() => CertificationCountAggregate, {nullable:true})
    _count?: CertificationCountAggregate;

    @Field(() => CertificationMinAggregate, {nullable:true})
    _min?: CertificationMinAggregate;

    @Field(() => CertificationMaxAggregate, {nullable:true})
    _max?: CertificationMaxAggregate;
}
