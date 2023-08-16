import { Field } from '@nestjs/graphql';
import { ObjectType } from '@nestjs/graphql';
import { Int } from '@nestjs/graphql';

@ObjectType()
export class UserCount {

    @Field(() => Int, {nullable:false})
    articles?: number;

    @Field(() => Int, {nullable:false})
    experiences?: number;

    @Field(() => Int, {nullable:false})
    educations?: number;

    @Field(() => Int, {nullable:false})
    certifications?: number;

    @Field(() => Int, {nullable:false})
    projects?: number;

    @Field(() => Int, {nullable:false})
    conferences?: number;
}
