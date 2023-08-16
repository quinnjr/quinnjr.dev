import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { ExperienceWhereUniqueInput } from './experience-where-unique.input';
import { Type } from 'class-transformer';
import { ExperienceCreateInput } from './experience-create.input';
import { ExperienceUpdateInput } from './experience-update.input';

@ArgsType()
export class UpsertOneExperienceArgs {

    @Field(() => ExperienceWhereUniqueInput, {nullable:false})
    @Type(() => ExperienceWhereUniqueInput)
    where!: Prisma.AtLeast<ExperienceWhereUniqueInput, 'id'>;

    @Field(() => ExperienceCreateInput, {nullable:false})
    @Type(() => ExperienceCreateInput)
    create!: ExperienceCreateInput;

    @Field(() => ExperienceUpdateInput, {nullable:false})
    @Type(() => ExperienceUpdateInput)
    update!: ExperienceUpdateInput;
}
