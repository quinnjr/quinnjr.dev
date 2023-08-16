import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { ExperienceWhereUniqueInput } from './experience-where-unique.input';
import { Type } from 'class-transformer';
import { ExperienceUpdateWithoutUserInput } from './experience-update-without-user.input';

@InputType()
export class ExperienceUpdateWithWhereUniqueWithoutUserInput {

    @Field(() => ExperienceWhereUniqueInput, {nullable:false})
    @Type(() => ExperienceWhereUniqueInput)
    where!: Prisma.AtLeast<ExperienceWhereUniqueInput, 'id'>;

    @Field(() => ExperienceUpdateWithoutUserInput, {nullable:false})
    @Type(() => ExperienceUpdateWithoutUserInput)
    data!: ExperienceUpdateWithoutUserInput;
}
