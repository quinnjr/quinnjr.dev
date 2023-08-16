import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { ExperienceUpdateInput } from './experience-update.input';
import { Type } from 'class-transformer';
import { Prisma } from '@prisma/client';
import { ExperienceWhereUniqueInput } from './experience-where-unique.input';

@ArgsType()
export class UpdateOneExperienceArgs {

    @Field(() => ExperienceUpdateInput, {nullable:false})
    @Type(() => ExperienceUpdateInput)
    data!: ExperienceUpdateInput;

    @Field(() => ExperienceWhereUniqueInput, {nullable:false})
    @Type(() => ExperienceWhereUniqueInput)
    where!: Prisma.AtLeast<ExperienceWhereUniqueInput, 'id'>;
}
