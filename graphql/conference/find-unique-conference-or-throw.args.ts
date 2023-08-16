import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { ConferenceWhereUniqueInput } from './conference-where-unique.input';
import { Type } from 'class-transformer';

@ArgsType()
export class FindUniqueConferenceOrThrowArgs {

    @Field(() => ConferenceWhereUniqueInput, {nullable:false})
    @Type(() => ConferenceWhereUniqueInput)
    where!: Prisma.AtLeast<ConferenceWhereUniqueInput, 'id' | 'name'>;
}
