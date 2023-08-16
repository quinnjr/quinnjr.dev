import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { ProjectWhereUniqueInput } from './project-where-unique.input';
import { Type } from 'class-transformer';
import { ProjectUpdateWithoutUserInput } from './project-update-without-user.input';
import { ProjectCreateWithoutUserInput } from './project-create-without-user.input';

@InputType()
export class ProjectUpsertWithWhereUniqueWithoutUserInput {

    @Field(() => ProjectWhereUniqueInput, {nullable:false})
    @Type(() => ProjectWhereUniqueInput)
    where!: Prisma.AtLeast<ProjectWhereUniqueInput, 'id' | 'name'>;

    @Field(() => ProjectUpdateWithoutUserInput, {nullable:false})
    @Type(() => ProjectUpdateWithoutUserInput)
    update!: ProjectUpdateWithoutUserInput;

    @Field(() => ProjectCreateWithoutUserInput, {nullable:false})
    @Type(() => ProjectCreateWithoutUserInput)
    create!: ProjectCreateWithoutUserInput;
}
