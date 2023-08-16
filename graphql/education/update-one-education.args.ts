import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { EducationUpdateInput } from './education-update.input';
import { Type } from 'class-transformer';
import { Prisma } from '@prisma/client';
import { EducationWhereUniqueInput } from './education-where-unique.input';

@ArgsType()
export class UpdateOneEducationArgs {

    @Field(() => EducationUpdateInput, {nullable:false})
    @Type(() => EducationUpdateInput)
    data!: EducationUpdateInput;

    @Field(() => EducationWhereUniqueInput, {nullable:false})
    @Type(() => EducationWhereUniqueInput)
    where!: Prisma.AtLeast<EducationWhereUniqueInput, 'id' | 'name' | 'graduationYear'>;
}
