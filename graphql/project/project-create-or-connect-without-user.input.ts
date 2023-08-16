import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { ProjectWhereUniqueInput } from './project-where-unique.input';
import { Type } from 'class-transformer';
import { ProjectCreateWithoutUserInput } from './project-create-without-user.input';

@InputType()
export class ProjectCreateOrConnectWithoutUserInput {

    @Field(() => ProjectWhereUniqueInput, {nullable:false})
    @Type(() => ProjectWhereUniqueInput)
    where!: Prisma.AtLeast<ProjectWhereUniqueInput, 'id' | 'name'>;

    @Field(() => ProjectCreateWithoutUserInput, {nullable:false})
    @Type(() => ProjectCreateWithoutUserInput)
    create!: ProjectCreateWithoutUserInput;
}
