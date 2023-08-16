import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { HideField } from '@nestjs/graphql';

@InputType()
export class UserCountAggregateInput {

    @Field(() => Boolean, {nullable:true})
    id?: true;

    @Field(() => Boolean, {nullable:true})
    email?: true;

    @HideField()
    passwordHash?: true;

    @Field(() => Boolean, {nullable:true})
    firstName?: true;

    @Field(() => Boolean, {nullable:true})
    middleName?: true;

    @Field(() => Boolean, {nullable:true})
    lastName?: true;

    @Field(() => Boolean, {nullable:true})
    website?: true;

    @Field(() => Boolean, {nullable:true})
    linkedin?: true;

    @Field(() => Boolean, {nullable:true})
    github?: true;

    @Field(() => Boolean, {nullable:true})
    profilePicture?: true;

    @Field(() => Boolean, {nullable:true})
    profile?: true;

    @Field(() => Boolean, {nullable:true})
    profileHighlights?: true;

    @Field(() => Boolean, {nullable:true})
    birthday?: true;

    @Field(() => Boolean, {nullable:true})
    skills?: true;

    @Field(() => Boolean, {nullable:true})
    yubikeys?: true;

    @Field(() => Boolean, {nullable:true})
    professionalMemberships?: true;

    @Field(() => Boolean, {nullable:true})
    role?: true;

    @Field(() => Boolean, {nullable:true})
    createdAt?: true;

    @Field(() => Boolean, {nullable:true})
    updatedAt?: true;

    @Field(() => Boolean, {nullable:true})
    _all?: true;
}
