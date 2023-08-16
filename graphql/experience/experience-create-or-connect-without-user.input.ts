import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { ExperienceWhereUniqueInput } from './experience-where-unique.input';
import { Type } from 'class-transformer';
import { ExperienceCreateWithoutUserInput } from './experience-create-without-user.input';

@InputType()
export class ExperienceCreateOrConnectWithoutUserInput {

    @Field(() => ExperienceWhereUniqueInput, {nullable:false})
    @Type(() => ExperienceWhereUniqueInput)
    where!: Prisma.AtLeast<ExperienceWhereUniqueInput, 'id'>;

    @Field(() => ExperienceCreateWithoutUserInput, {nullable:false})
    @Type(() => ExperienceCreateWithoutUserInput)
    create!: ExperienceCreateWithoutUserInput;
}
