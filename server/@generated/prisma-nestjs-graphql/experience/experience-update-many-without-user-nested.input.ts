import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { ExperienceCreateWithoutUserInput } from './experience-create-without-user.input';
import { ExperienceCreateOrConnectWithoutUserInput } from './experience-create-or-connect-without-user.input';
import { ExperienceUpsertWithWhereUniqueWithoutUserInput } from './experience-upsert-with-where-unique-without-user.input';
import { ExperienceCreateManyUserInputEnvelope } from './experience-create-many-user-input-envelope.input';
import { ExperienceWhereUniqueInput } from './experience-where-unique.input';
import { ExperienceUpdateWithWhereUniqueWithoutUserInput } from './experience-update-with-where-unique-without-user.input';
import { ExperienceUpdateManyWithWhereWithoutUserInput } from './experience-update-many-with-where-without-user.input';
import { ExperienceScalarWhereInput } from './experience-scalar-where.input';

@InputType()
export class ExperienceUpdateManyWithoutUserNestedInput {

    @Field(() => [ExperienceCreateWithoutUserInput], {nullable:true})
    create?: Array<ExperienceCreateWithoutUserInput>;

    @Field(() => [ExperienceCreateOrConnectWithoutUserInput], {nullable:true})
    connectOrCreate?: Array<ExperienceCreateOrConnectWithoutUserInput>;

    @Field(() => [ExperienceUpsertWithWhereUniqueWithoutUserInput], {nullable:true})
    upsert?: Array<ExperienceUpsertWithWhereUniqueWithoutUserInput>;

    @Field(() => ExperienceCreateManyUserInputEnvelope, {nullable:true})
    createMany?: ExperienceCreateManyUserInputEnvelope;

    @Field(() => [ExperienceWhereUniqueInput], {nullable:true})
    set?: Array<ExperienceWhereUniqueInput>;

    @Field(() => [ExperienceWhereUniqueInput], {nullable:true})
    disconnect?: Array<ExperienceWhereUniqueInput>;

    @Field(() => [ExperienceWhereUniqueInput], {nullable:true})
    delete?: Array<ExperienceWhereUniqueInput>;

    @Field(() => [ExperienceWhereUniqueInput], {nullable:true})
    connect?: Array<ExperienceWhereUniqueInput>;

    @Field(() => [ExperienceUpdateWithWhereUniqueWithoutUserInput], {nullable:true})
    update?: Array<ExperienceUpdateWithWhereUniqueWithoutUserInput>;

    @Field(() => [ExperienceUpdateManyWithWhereWithoutUserInput], {nullable:true})
    updateMany?: Array<ExperienceUpdateManyWithWhereWithoutUserInput>;

    @Field(() => [ExperienceScalarWhereInput], {nullable:true})
    deleteMany?: Array<ExperienceScalarWhereInput>;
}
