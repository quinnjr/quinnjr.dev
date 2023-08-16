import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { ConferenceCreateWithoutUserInput } from './conference-create-without-user.input';
import { Type } from 'class-transformer';
import { ConferenceCreateOrConnectWithoutUserInput } from './conference-create-or-connect-without-user.input';
import { ConferenceUpsertWithWhereUniqueWithoutUserInput } from './conference-upsert-with-where-unique-without-user.input';
import { ConferenceCreateManyUserInputEnvelope } from './conference-create-many-user-input-envelope.input';
import { Prisma } from '@prisma/client';
import { ConferenceWhereUniqueInput } from './conference-where-unique.input';
import { ConferenceUpdateWithWhereUniqueWithoutUserInput } from './conference-update-with-where-unique-without-user.input';
import { ConferenceUpdateManyWithWhereWithoutUserInput } from './conference-update-many-with-where-without-user.input';
import { ConferenceScalarWhereInput } from './conference-scalar-where.input';

@InputType()
export class ConferenceUncheckedUpdateManyWithoutUserNestedInput {

    @Field(() => [ConferenceCreateWithoutUserInput], {nullable:true})
    @Type(() => ConferenceCreateWithoutUserInput)
    create?: Array<ConferenceCreateWithoutUserInput>;

    @Field(() => [ConferenceCreateOrConnectWithoutUserInput], {nullable:true})
    @Type(() => ConferenceCreateOrConnectWithoutUserInput)
    connectOrCreate?: Array<ConferenceCreateOrConnectWithoutUserInput>;

    @Field(() => [ConferenceUpsertWithWhereUniqueWithoutUserInput], {nullable:true})
    @Type(() => ConferenceUpsertWithWhereUniqueWithoutUserInput)
    upsert?: Array<ConferenceUpsertWithWhereUniqueWithoutUserInput>;

    @Field(() => ConferenceCreateManyUserInputEnvelope, {nullable:true})
    @Type(() => ConferenceCreateManyUserInputEnvelope)
    createMany?: ConferenceCreateManyUserInputEnvelope;

    @Field(() => [ConferenceWhereUniqueInput], {nullable:true})
    @Type(() => ConferenceWhereUniqueInput)
    set?: Array<Prisma.AtLeast<ConferenceWhereUniqueInput, 'id' | 'name'>>;

    @Field(() => [ConferenceWhereUniqueInput], {nullable:true})
    @Type(() => ConferenceWhereUniqueInput)
    disconnect?: Array<Prisma.AtLeast<ConferenceWhereUniqueInput, 'id' | 'name'>>;

    @Field(() => [ConferenceWhereUniqueInput], {nullable:true})
    @Type(() => ConferenceWhereUniqueInput)
    delete?: Array<Prisma.AtLeast<ConferenceWhereUniqueInput, 'id' | 'name'>>;

    @Field(() => [ConferenceWhereUniqueInput], {nullable:true})
    @Type(() => ConferenceWhereUniqueInput)
    connect?: Array<Prisma.AtLeast<ConferenceWhereUniqueInput, 'id' | 'name'>>;

    @Field(() => [ConferenceUpdateWithWhereUniqueWithoutUserInput], {nullable:true})
    @Type(() => ConferenceUpdateWithWhereUniqueWithoutUserInput)
    update?: Array<ConferenceUpdateWithWhereUniqueWithoutUserInput>;

    @Field(() => [ConferenceUpdateManyWithWhereWithoutUserInput], {nullable:true})
    @Type(() => ConferenceUpdateManyWithWhereWithoutUserInput)
    updateMany?: Array<ConferenceUpdateManyWithWhereWithoutUserInput>;

    @Field(() => [ConferenceScalarWhereInput], {nullable:true})
    @Type(() => ConferenceScalarWhereInput)
    deleteMany?: Array<ConferenceScalarWhereInput>;
}
