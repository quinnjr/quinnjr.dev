import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { ProjectCreateWithoutUserInput } from './project-create-without-user.input';
import { Type } from 'class-transformer';
import { ProjectCreateOrConnectWithoutUserInput } from './project-create-or-connect-without-user.input';
import { ProjectUpsertWithWhereUniqueWithoutUserInput } from './project-upsert-with-where-unique-without-user.input';
import { ProjectCreateManyUserInputEnvelope } from './project-create-many-user-input-envelope.input';
import { Prisma } from '@prisma/client';
import { ProjectWhereUniqueInput } from './project-where-unique.input';
import { ProjectUpdateWithWhereUniqueWithoutUserInput } from './project-update-with-where-unique-without-user.input';
import { ProjectUpdateManyWithWhereWithoutUserInput } from './project-update-many-with-where-without-user.input';
import { ProjectScalarWhereInput } from './project-scalar-where.input';

@InputType()
export class ProjectUncheckedUpdateManyWithoutUserNestedInput {

    @Field(() => [ProjectCreateWithoutUserInput], {nullable:true})
    @Type(() => ProjectCreateWithoutUserInput)
    create?: Array<ProjectCreateWithoutUserInput>;

    @Field(() => [ProjectCreateOrConnectWithoutUserInput], {nullable:true})
    @Type(() => ProjectCreateOrConnectWithoutUserInput)
    connectOrCreate?: Array<ProjectCreateOrConnectWithoutUserInput>;

    @Field(() => [ProjectUpsertWithWhereUniqueWithoutUserInput], {nullable:true})
    @Type(() => ProjectUpsertWithWhereUniqueWithoutUserInput)
    upsert?: Array<ProjectUpsertWithWhereUniqueWithoutUserInput>;

    @Field(() => ProjectCreateManyUserInputEnvelope, {nullable:true})
    @Type(() => ProjectCreateManyUserInputEnvelope)
    createMany?: ProjectCreateManyUserInputEnvelope;

    @Field(() => [ProjectWhereUniqueInput], {nullable:true})
    @Type(() => ProjectWhereUniqueInput)
    set?: Array<Prisma.AtLeast<ProjectWhereUniqueInput, 'id' | 'name'>>;

    @Field(() => [ProjectWhereUniqueInput], {nullable:true})
    @Type(() => ProjectWhereUniqueInput)
    disconnect?: Array<Prisma.AtLeast<ProjectWhereUniqueInput, 'id' | 'name'>>;

    @Field(() => [ProjectWhereUniqueInput], {nullable:true})
    @Type(() => ProjectWhereUniqueInput)
    delete?: Array<Prisma.AtLeast<ProjectWhereUniqueInput, 'id' | 'name'>>;

    @Field(() => [ProjectWhereUniqueInput], {nullable:true})
    @Type(() => ProjectWhereUniqueInput)
    connect?: Array<Prisma.AtLeast<ProjectWhereUniqueInput, 'id' | 'name'>>;

    @Field(() => [ProjectUpdateWithWhereUniqueWithoutUserInput], {nullable:true})
    @Type(() => ProjectUpdateWithWhereUniqueWithoutUserInput)
    update?: Array<ProjectUpdateWithWhereUniqueWithoutUserInput>;

    @Field(() => [ProjectUpdateManyWithWhereWithoutUserInput], {nullable:true})
    @Type(() => ProjectUpdateManyWithWhereWithoutUserInput)
    updateMany?: Array<ProjectUpdateManyWithWhereWithoutUserInput>;

    @Field(() => [ProjectScalarWhereInput], {nullable:true})
    @Type(() => ProjectScalarWhereInput)
    deleteMany?: Array<ProjectScalarWhereInput>;
}
