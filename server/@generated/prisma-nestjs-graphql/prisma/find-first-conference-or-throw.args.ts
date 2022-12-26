import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { ConferenceWhereInput } from '../conference/conference-where.input';
import { ConferenceOrderByWithRelationInput } from '../conference/conference-order-by-with-relation.input';
import { ConferenceWhereUniqueInput } from '../conference/conference-where-unique.input';
import { Int } from '@nestjs/graphql';
import { ConferenceScalarFieldEnum } from '../conference/conference-scalar-field.enum';

@ArgsType()
export class FindFirstConferenceOrThrowArgs {

    @Field(() => ConferenceWhereInput, {nullable:true})
    where?: ConferenceWhereInput;

    @Field(() => [ConferenceOrderByWithRelationInput], {nullable:true})
    orderBy?: Array<ConferenceOrderByWithRelationInput>;

    @Field(() => ConferenceWhereUniqueInput, {nullable:true})
    cursor?: ConferenceWhereUniqueInput;

    @Field(() => Int, {nullable:true})
    take?: number;

    @Field(() => Int, {nullable:true})
    skip?: number;

    @Field(() => [ConferenceScalarFieldEnum], {nullable:true})
    distinct?: Array<keyof typeof ConferenceScalarFieldEnum>;
}
