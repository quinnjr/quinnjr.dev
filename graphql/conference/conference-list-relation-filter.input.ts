import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { ConferenceWhereInput } from './conference-where.input';

@InputType()
export class ConferenceListRelationFilter {

    @Field(() => ConferenceWhereInput, {nullable:true})
    every?: ConferenceWhereInput;

    @Field(() => ConferenceWhereInput, {nullable:true})
    some?: ConferenceWhereInput;

    @Field(() => ConferenceWhereInput, {nullable:true})
    none?: ConferenceWhereInput;
}
