import { Field } from '@nestjs/graphql';
import { ObjectType } from '@nestjs/graphql';
import { ID } from '@nestjs/graphql';
import { Int } from '@nestjs/graphql';
import { User } from '../user/user.model';

@ObjectType()
export class Education {

    @Field(() => ID, {nullable:false})
    id!: string;

    @Field(() => String, {nullable:false})
    name!: string;

    @Field(() => String, {nullable:false})
    location!: string;

    @Field(() => String, {nullable:false})
    degree!: string;

    @Field(() => Date, {nullable:true})
    startYear!: Date | null;

    @Field(() => Int, {nullable:true})
    graduationYear!: number | null;

    @Field(() => [String], {nullable:true})
    activities!: Array<string>;

    @Field(() => String, {nullable:false})
    campusImage!: string;

    @Field(() => String, {nullable:false})
    url!: string;

    @Field(() => String, {nullable:false})
    userId!: string;

    @Field(() => User, {nullable:false})
    user?: User;
}
