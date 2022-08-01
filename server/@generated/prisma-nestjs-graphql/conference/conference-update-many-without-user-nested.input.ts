import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { ConferenceCreateWithoutUserInput } from './conference-create-without-user.input';
import { ConferenceCreateOrConnectWithoutUserInput } from './conference-create-or-connect-without-user.input';
import { ConferenceUpsertWithWhereUniqueWithoutUserInput } from './conference-upsert-with-where-unique-without-user.input';
import { ConferenceCreateManyUserInputEnvelope } from './conference-create-many-user-input-envelope.input';
import { ConferenceWhereUniqueInput } from './conference-where-unique.input';
import { ConferenceUpdateWithWhereUniqueWithoutUserInput } from './conference-update-with-where-unique-without-user.input';
import { ConferenceUpdateManyWithWhereWithoutUserInput } from './conference-update-many-with-where-without-user.input';
import { ConferenceScalarWhereInput } from './conference-scalar-where.input';

@InputType()
export class ConferenceUpdateManyWithoutUserNestedInput {

    @Field(() => [ConferenceCreateWithoutUserInput], {nullable:true})
    create?: Array<ConferenceCreateWithoutUserInput>;

    @Field(() => [ConferenceCreateOrConnectWithoutUserInput], {nullable:true})
    connectOrCreate?: Array<ConferenceCreateOrConnectWithoutUserInput>;

    @Field(() => [ConferenceUpsertWithWhereUniqueWithoutUserInput], {nullable:true})
    upsert?: Array<ConferenceUpsertWithWhereUniqueWithoutUserInput>;

    @Field(() => ConferenceCreateManyUserInputEnvelope, {nullable:true})
    createMany?: ConferenceCreateManyUserInputEnvelope;

    @Field(() => [ConferenceWhereUniqueInput], {nullable:true})
    set?: Array<ConferenceWhereUniqueInput>;

    @Field(() => [ConferenceWhereUniqueInput], {nullable:true})
    disconnect?: Array<ConferenceWhereUniqueInput>;

    @Field(() => [ConferenceWhereUniqueInput], {nullable:true})
    delete?: Array<ConferenceWhereUniqueInput>;

    @Field(() => [ConferenceWhereUniqueInput], {nullable:true})
    connect?: Array<ConferenceWhereUniqueInput>;

    @Field(() => [ConferenceUpdateWithWhereUniqueWithoutUserInput], {nullable:true})
    update?: Array<ConferenceUpdateWithWhereUniqueWithoutUserInput>;

    @Field(() => [ConferenceUpdateManyWithWhereWithoutUserInput], {nullable:true})
    updateMany?: Array<ConferenceUpdateManyWithWhereWithoutUserInput>;

    @Field(() => [ConferenceScalarWhereInput], {nullable:true})
    deleteMany?: Array<ConferenceScalarWhereInput>;
}
