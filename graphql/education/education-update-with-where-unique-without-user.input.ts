import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { EducationWhereUniqueInput } from './education-where-unique.input';
import { Type } from 'class-transformer';
import { EducationUpdateWithoutUserInput } from './education-update-without-user.input';

@InputType()
export class EducationUpdateWithWhereUniqueWithoutUserInput {

    @Field(() => EducationWhereUniqueInput, {nullable:false})
    @Type(() => EducationWhereUniqueInput)
    where!: Prisma.AtLeast<EducationWhereUniqueInput, 'id' | 'name' | 'graduationYear'>;

    @Field(() => EducationUpdateWithoutUserInput, {nullable:false})
    @Type(() => EducationUpdateWithoutUserInput)
    data!: EducationUpdateWithoutUserInput;
}
