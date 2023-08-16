import { Field } from '@nestjs/graphql';
import { ObjectType } from '@nestjs/graphql';
import { Int } from '@nestjs/graphql';

@ObjectType()
export class EducationMaxAggregate {

    @Field(() => String, {nullable:true})
    id?: string;

    @Field(() => String, {nullable:true})
    name?: string;

    @Field(() => String, {nullable:true})
    location?: string;

    @Field(() => String, {nullable:true})
    degree?: string;

    @Field(() => Date, {nullable:true})
    startYear?: Date | string;

    @Field(() => Int, {nullable:true})
    graduationYear?: number;

    @Field(() => String, {nullable:true})
    campusImage?: string;

    @Field(() => String, {nullable:true})
    url?: string;

    @Field(() => String, {nullable:true})
    userId?: string;
}
