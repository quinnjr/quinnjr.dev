import { Field } from '@nestjs/graphql';
import { ObjectType } from '@nestjs/graphql';
import { Int } from '@nestjs/graphql';
import { HideField } from '@nestjs/graphql';

@ObjectType()
export class UserCountAggregate {

    @Field(() => Int, {nullable:false})
    id!: number;

    @Field(() => Int, {nullable:false})
    email!: number;

    @HideField()
    passwordHash!: number;

    @Field(() => Int, {nullable:false})
    firstName!: number;

    @Field(() => Int, {nullable:false})
    middleName!: number;

    @Field(() => Int, {nullable:false})
    lastName!: number;

    @Field(() => Int, {nullable:false})
    website!: number;

    @Field(() => Int, {nullable:false})
    linkedin!: number;

    @Field(() => Int, {nullable:false})
    github!: number;

    @Field(() => Int, {nullable:false})
    profilePicture!: number;

    @Field(() => Int, {nullable:false})
    profile!: number;

    @Field(() => Int, {nullable:false})
    profileHighlights!: number;

    @Field(() => Int, {nullable:false})
    birthday!: number;

    @Field(() => Int, {nullable:false})
    skills!: number;

    @Field(() => Int, {nullable:false})
    yubikeys!: number;

    @Field(() => Int, {nullable:false})
    professionalMemberships!: number;

    @Field(() => Int, {nullable:false})
    role!: number;

    @HideField()
    createdAt!: number;

    @Field(() => Int, {nullable:false})
    updatedAt!: number;

    @Field(() => Int, {nullable:false})
    _all!: number;
}
