import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { ConferenceUpdateInput } from './conference-update.input';
import { Type } from 'class-transformer';
import { Prisma } from '@prisma/client';
import { ConferenceWhereUniqueInput } from './conference-where-unique.input';

@ArgsType()
export class UpdateOneConferenceArgs {

    @Field(() => ConferenceUpdateInput, {nullable:false})
    @Type(() => ConferenceUpdateInput)
    data!: ConferenceUpdateInput;

    @Field(() => ConferenceWhereUniqueInput, {nullable:false})
    @Type(() => ConferenceWhereUniqueInput)
    where!: Prisma.AtLeast<ConferenceWhereUniqueInput, 'id' | 'name'>;
}
