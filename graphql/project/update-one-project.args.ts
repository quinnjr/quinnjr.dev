import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { ProjectUpdateInput } from './project-update.input';
import { Type } from 'class-transformer';
import { Prisma } from '@prisma/client';
import { ProjectWhereUniqueInput } from './project-where-unique.input';

@ArgsType()
export class UpdateOneProjectArgs {

    @Field(() => ProjectUpdateInput, {nullable:false})
    @Type(() => ProjectUpdateInput)
    data!: ProjectUpdateInput;

    @Field(() => ProjectWhereUniqueInput, {nullable:false})
    @Type(() => ProjectWhereUniqueInput)
    where!: Prisma.AtLeast<ProjectWhereUniqueInput, 'id' | 'name'>;
}
