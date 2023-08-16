import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { ConferenceWhereInput } from './conference-where.input';
import { Type } from 'class-transformer';
import { ConferenceOrderByWithRelationInput } from './conference-order-by-with-relation.input';
import { Prisma } from '@prisma/client';
import { ConferenceWhereUniqueInput } from './conference-where-unique.input';
import { Int } from '@nestjs/graphql';
import { ConferenceScalarFieldEnum } from './conference-scalar-field.enum';

@ArgsType()
export class FindFirstConferenceArgs {

    @Field(() => ConferenceWhereInput, {nullable:true})
    @Type(() => ConferenceWhereInput)
    where?: ConferenceWhereInput;

    @Field(() => [ConferenceOrderByWithRelationInput], {nullable:true})
    orderBy?: Array<ConferenceOrderByWithRelationInput>;

    @Field(() => ConferenceWhereUniqueInput, {nullable:true})
    cursor?: Prisma.AtLeast<ConferenceWhereUniqueInput, 'id' | 'name'>;

    @Field(() => Int, {nullable:true})
    take?: number;

    @Field(() => Int, {nullable:true})
    skip?: number;

    @Field(() => [ConferenceScalarFieldEnum], {nullable:true})
    distinct?: Array<keyof typeof ConferenceScalarFieldEnum>;
}
