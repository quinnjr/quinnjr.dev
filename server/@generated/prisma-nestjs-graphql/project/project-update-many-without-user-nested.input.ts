import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { ProjectCreateWithoutUserInput } from './project-create-without-user.input';
import { ProjectCreateOrConnectWithoutUserInput } from './project-create-or-connect-without-user.input';
import { ProjectUpsertWithWhereUniqueWithoutUserInput } from './project-upsert-with-where-unique-without-user.input';
import { ProjectCreateManyUserInputEnvelope } from './project-create-many-user-input-envelope.input';
import { ProjectWhereUniqueInput } from './project-where-unique.input';
import { ProjectUpdateWithWhereUniqueWithoutUserInput } from './project-update-with-where-unique-without-user.input';
import { ProjectUpdateManyWithWhereWithoutUserInput } from './project-update-many-with-where-without-user.input';
import { ProjectScalarWhereInput } from './project-scalar-where.input';

@InputType()
export class ProjectUpdateManyWithoutUserNestedInput {

    @Field(() => [ProjectCreateWithoutUserInput], {nullable:true})
    create?: Array<ProjectCreateWithoutUserInput>;

    @Field(() => [ProjectCreateOrConnectWithoutUserInput], {nullable:true})
    connectOrCreate?: Array<ProjectCreateOrConnectWithoutUserInput>;

    @Field(() => [ProjectUpsertWithWhereUniqueWithoutUserInput], {nullable:true})
    upsert?: Array<ProjectUpsertWithWhereUniqueWithoutUserInput>;

    @Field(() => ProjectCreateManyUserInputEnvelope, {nullable:true})
    createMany?: ProjectCreateManyUserInputEnvelope;

    @Field(() => [ProjectWhereUniqueInput], {nullable:true})
    set?: Array<ProjectWhereUniqueInput>;

    @Field(() => [ProjectWhereUniqueInput], {nullable:true})
    disconnect?: Array<ProjectWhereUniqueInput>;

    @Field(() => [ProjectWhereUniqueInput], {nullable:true})
    delete?: Array<ProjectWhereUniqueInput>;

    @Field(() => [ProjectWhereUniqueInput], {nullable:true})
    connect?: Array<ProjectWhereUniqueInput>;

    @Field(() => [ProjectUpdateWithWhereUniqueWithoutUserInput], {nullable:true})
    update?: Array<ProjectUpdateWithWhereUniqueWithoutUserInput>;

    @Field(() => [ProjectUpdateManyWithWhereWithoutUserInput], {nullable:true})
    updateMany?: Array<ProjectUpdateManyWithWhereWithoutUserInput>;

    @Field(() => [ProjectScalarWhereInput], {nullable:true})
    deleteMany?: Array<ProjectScalarWhereInput>;
}
