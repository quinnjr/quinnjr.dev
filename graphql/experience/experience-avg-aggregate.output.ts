import { Field } from '@nestjs/graphql';
import { ObjectType } from '@nestjs/graphql';
import { Float } from '@nestjs/graphql';

@ObjectType()
export class ExperienceAvgAggregate {

    @Field(() => Float, {nullable:true})
    startYear?: number;

    @Field(() => Float, {nullable:true})
    endYear?: number;
}
