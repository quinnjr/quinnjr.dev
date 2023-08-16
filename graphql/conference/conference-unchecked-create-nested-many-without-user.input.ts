import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { ConferenceCreateWithoutUserInput } from './conference-create-without-user.input';
import { Type } from 'class-transformer';
import { ConferenceCreateOrConnectWithoutUserInput } from './conference-create-or-connect-without-user.input';
import { ConferenceCreateManyUserInputEnvelope } from './conference-create-many-user-input-envelope.input';
import { Prisma } from '@prisma/client';
import { ConferenceWhereUniqueInput } from './conference-where-unique.input';

@InputType()
export class ConferenceUncheckedCreateNestedManyWithoutUserInput {

    @Field(() => [ConferenceCreateWithoutUserInput], {nullable:true})
    @Type(() => ConferenceCreateWithoutUserInput)
    create?: Array<ConferenceCreateWithoutUserInput>;

    @Field(() => [ConferenceCreateOrConnectWithoutUserInput], {nullable:true})
    @Type(() => ConferenceCreateOrConnectWithoutUserInput)
    connectOrCreate?: Array<ConferenceCreateOrConnectWithoutUserInput>;

    @Field(() => ConferenceCreateManyUserInputEnvelope, {nullable:true})
    @Type(() => ConferenceCreateManyUserInputEnvelope)
    createMany?: ConferenceCreateManyUserInputEnvelope;

    @Field(() => [ConferenceWhereUniqueInput], {nullable:true})
    @Type(() => ConferenceWhereUniqueInput)
    connect?: Array<Prisma.AtLeast<ConferenceWhereUniqueInput, 'id' | 'name'>>;
}
