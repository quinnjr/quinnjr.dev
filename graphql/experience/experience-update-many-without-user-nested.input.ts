import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { ExperienceCreateWithoutUserInput } from './experience-create-without-user.input';
import { Type } from 'class-transformer';
import { ExperienceCreateOrConnectWithoutUserInput } from './experience-create-or-connect-without-user.input';
import { ExperienceUpsertWithWhereUniqueWithoutUserInput } from './experience-upsert-with-where-unique-without-user.input';
import { ExperienceCreateManyUserInputEnvelope } from './experience-create-many-user-input-envelope.input';
import { Prisma } from '@prisma/client';
import { ExperienceWhereUniqueInput } from './experience-where-unique.input';
import { ExperienceUpdateWithWhereUniqueWithoutUserInput } from './experience-update-with-where-unique-without-user.input';
import { ExperienceUpdateManyWithWhereWithoutUserInput } from './experience-update-many-with-where-without-user.input';
import { ExperienceScalarWhereInput } from './experience-scalar-where.input';

@InputType()
export class ExperienceUpdateManyWithoutUserNestedInput {

    @Field(() => [ExperienceCreateWithoutUserInput], {nullable:true})
    @Type(() => ExperienceCreateWithoutUserInput)
    create?: Array<ExperienceCreateWithoutUserInput>;

    @Field(() => [ExperienceCreateOrConnectWithoutUserInput], {nullable:true})
    @Type(() => ExperienceCreateOrConnectWithoutUserInput)
    connectOrCreate?: Array<ExperienceCreateOrConnectWithoutUserInput>;

    @Field(() => [ExperienceUpsertWithWhereUniqueWithoutUserInput], {nullable:true})
    @Type(() => ExperienceUpsertWithWhereUniqueWithoutUserInput)
    upsert?: Array<ExperienceUpsertWithWhereUniqueWithoutUserInput>;

    @Field(() => ExperienceCreateManyUserInputEnvelope, {nullable:true})
    @Type(() => ExperienceCreateManyUserInputEnvelope)
    createMany?: ExperienceCreateManyUserInputEnvelope;

    @Field(() => [ExperienceWhereUniqueInput], {nullable:true})
    @Type(() => ExperienceWhereUniqueInput)
    set?: Array<Prisma.AtLeast<ExperienceWhereUniqueInput, 'id'>>;

    @Field(() => [ExperienceWhereUniqueInput], {nullable:true})
    @Type(() => ExperienceWhereUniqueInput)
    disconnect?: Array<Prisma.AtLeast<ExperienceWhereUniqueInput, 'id'>>;

    @Field(() => [ExperienceWhereUniqueInput], {nullable:true})
    @Type(() => ExperienceWhereUniqueInput)
    delete?: Array<Prisma.AtLeast<ExperienceWhereUniqueInput, 'id'>>;

    @Field(() => [ExperienceWhereUniqueInput], {nullable:true})
    @Type(() => ExperienceWhereUniqueInput)
    connect?: Array<Prisma.AtLeast<ExperienceWhereUniqueInput, 'id'>>;

    @Field(() => [ExperienceUpdateWithWhereUniqueWithoutUserInput], {nullable:true})
    @Type(() => ExperienceUpdateWithWhereUniqueWithoutUserInput)
    update?: Array<ExperienceUpdateWithWhereUniqueWithoutUserInput>;

    @Field(() => [ExperienceUpdateManyWithWhereWithoutUserInput], {nullable:true})
    @Type(() => ExperienceUpdateManyWithWhereWithoutUserInput)
    updateMany?: Array<ExperienceUpdateManyWithWhereWithoutUserInput>;

    @Field(() => [ExperienceScalarWhereInput], {nullable:true})
    @Type(() => ExperienceScalarWhereInput)
    deleteMany?: Array<ExperienceScalarWhereInput>;
}
