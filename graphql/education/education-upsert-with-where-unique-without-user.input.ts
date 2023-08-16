import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { EducationWhereUniqueInput } from './education-where-unique.input';
import { Type } from 'class-transformer';
import { EducationUpdateWithoutUserInput } from './education-update-without-user.input';
import { EducationCreateWithoutUserInput } from './education-create-without-user.input';

@InputType()
export class EducationUpsertWithWhereUniqueWithoutUserInput {

    @Field(() => EducationWhereUniqueInput, {nullable:false})
    @Type(() => EducationWhereUniqueInput)
    where!: Prisma.AtLeast<EducationWhereUniqueInput, 'id' | 'name' | 'graduationYear'>;

    @Field(() => EducationUpdateWithoutUserInput, {nullable:false})
    @Type(() => EducationUpdateWithoutUserInput)
    update!: EducationUpdateWithoutUserInput;

    @Field(() => EducationCreateWithoutUserInput, {nullable:false})
    @Type(() => EducationCreateWithoutUserInput)
    create!: EducationCreateWithoutUserInput;
}
