import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { ExperienceCreateWithoutUserInput } from './experience-create-without-user.input';
import { Type } from 'class-transformer';
import { ExperienceCreateOrConnectWithoutUserInput } from './experience-create-or-connect-without-user.input';
import { ExperienceCreateManyUserInputEnvelope } from './experience-create-many-user-input-envelope.input';
import { Prisma } from '@prisma/client';
import { ExperienceWhereUniqueInput } from './experience-where-unique.input';

@InputType()
export class ExperienceCreateNestedManyWithoutUserInput {

    @Field(() => [ExperienceCreateWithoutUserInput], {nullable:true})
    @Type(() => ExperienceCreateWithoutUserInput)
    create?: Array<ExperienceCreateWithoutUserInput>;

    @Field(() => [ExperienceCreateOrConnectWithoutUserInput], {nullable:true})
    @Type(() => ExperienceCreateOrConnectWithoutUserInput)
    connectOrCreate?: Array<ExperienceCreateOrConnectWithoutUserInput>;

    @Field(() => ExperienceCreateManyUserInputEnvelope, {nullable:true})
    @Type(() => ExperienceCreateManyUserInputEnvelope)
    createMany?: ExperienceCreateManyUserInputEnvelope;

    @Field(() => [ExperienceWhereUniqueInput], {nullable:true})
    @Type(() => ExperienceWhereUniqueInput)
    connect?: Array<Prisma.AtLeast<ExperienceWhereUniqueInput, 'id'>>;
}
