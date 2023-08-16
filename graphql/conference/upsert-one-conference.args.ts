import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { ConferenceWhereUniqueInput } from './conference-where-unique.input';
import { Type } from 'class-transformer';
import { ConferenceCreateInput } from './conference-create.input';
import { ConferenceUpdateInput } from './conference-update.input';

@ArgsType()
export class UpsertOneConferenceArgs {

    @Field(() => ConferenceWhereUniqueInput, {nullable:false})
    @Type(() => ConferenceWhereUniqueInput)
    where!: Prisma.AtLeast<ConferenceWhereUniqueInput, 'id' | 'name'>;

    @Field(() => ConferenceCreateInput, {nullable:false})
    @Type(() => ConferenceCreateInput)
    create!: ConferenceCreateInput;

    @Field(() => ConferenceUpdateInput, {nullable:false})
    @Type(() => ConferenceUpdateInput)
    update!: ConferenceUpdateInput;
}
