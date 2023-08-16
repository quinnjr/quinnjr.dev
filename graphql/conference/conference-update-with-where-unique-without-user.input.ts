import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { ConferenceWhereUniqueInput } from './conference-where-unique.input';
import { Type } from 'class-transformer';
import { ConferenceUpdateWithoutUserInput } from './conference-update-without-user.input';

@InputType()
export class ConferenceUpdateWithWhereUniqueWithoutUserInput {

    @Field(() => ConferenceWhereUniqueInput, {nullable:false})
    @Type(() => ConferenceWhereUniqueInput)
    where!: Prisma.AtLeast<ConferenceWhereUniqueInput, 'id' | 'name'>;

    @Field(() => ConferenceUpdateWithoutUserInput, {nullable:false})
    @Type(() => ConferenceUpdateWithoutUserInput)
    data!: ConferenceUpdateWithoutUserInput;
}
