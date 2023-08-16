import { Field } from '@nestjs/graphql';
import { ObjectType } from '@nestjs/graphql';
import { Int } from '@nestjs/graphql';

@ObjectType()
export class EducationCountAggregate {

    @Field(() => Int, {nullable:false})
    id!: number;

    @Field(() => Int, {nullable:false})
    name!: number;

    @Field(() => Int, {nullable:false})
    location!: number;

    @Field(() => Int, {nullable:false})
    degree!: number;

    @Field(() => Int, {nullable:false})
    startYear!: number;

    @Field(() => Int, {nullable:false})
    graduationYear!: number;

    @Field(() => Int, {nullable:false})
    activities!: number;

    @Field(() => Int, {nullable:false})
    campusImage!: number;

    @Field(() => Int, {nullable:false})
    url!: number;

    @Field(() => Int, {nullable:false})
    userId!: number;

    @Field(() => Int, {nullable:false})
    _all!: number;
}
