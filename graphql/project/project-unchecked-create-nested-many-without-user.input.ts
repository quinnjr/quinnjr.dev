import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { ProjectCreateWithoutUserInput } from './project-create-without-user.input';
import { Type } from 'class-transformer';
import { ProjectCreateOrConnectWithoutUserInput } from './project-create-or-connect-without-user.input';
import { ProjectCreateManyUserInputEnvelope } from './project-create-many-user-input-envelope.input';
import { Prisma } from '@prisma/client';
import { ProjectWhereUniqueInput } from './project-where-unique.input';

@InputType()
export class ProjectUncheckedCreateNestedManyWithoutUserInput {

    @Field(() => [ProjectCreateWithoutUserInput], {nullable:true})
    @Type(() => ProjectCreateWithoutUserInput)
    create?: Array<ProjectCreateWithoutUserInput>;

    @Field(() => [ProjectCreateOrConnectWithoutUserInput], {nullable:true})
    @Type(() => ProjectCreateOrConnectWithoutUserInput)
    connectOrCreate?: Array<ProjectCreateOrConnectWithoutUserInput>;

    @Field(() => ProjectCreateManyUserInputEnvelope, {nullable:true})
    @Type(() => ProjectCreateManyUserInputEnvelope)
    createMany?: ProjectCreateManyUserInputEnvelope;

    @Field(() => [ProjectWhereUniqueInput], {nullable:true})
    @Type(() => ProjectWhereUniqueInput)
    connect?: Array<Prisma.AtLeast<ProjectWhereUniqueInput, 'id' | 'name'>>;
}
