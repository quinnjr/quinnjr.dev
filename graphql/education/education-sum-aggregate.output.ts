import { Field } from '@nestjs/graphql';
import { ObjectType } from '@nestjs/graphql';
import { Int } from '@nestjs/graphql';

@ObjectType()
export class EducationSumAggregate {

    @Field(() => Int, {nullable:true})
    graduationYear?: number;
}
