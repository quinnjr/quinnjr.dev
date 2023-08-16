import { Field } from '@nestjs/graphql';
import { ObjectType } from '@nestjs/graphql';
import { Float } from '@nestjs/graphql';

@ObjectType()
export class EducationAvgAggregate {

    @Field(() => Float, {nullable:true})
    graduationYear?: number;
}
