import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { ExperienceWhereUniqueInput } from './experience-where-unique.input';
import { Type } from 'class-transformer';

@ArgsType()
export class FindUniqueExperienceOrThrowArgs {

    @Field(() => ExperienceWhereUniqueInput, {nullable:false})
    @Type(() => ExperienceWhereUniqueInput)
    where!: Prisma.AtLeast<ExperienceWhereUniqueInput, 'id'>;
}
