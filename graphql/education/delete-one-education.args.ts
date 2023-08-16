import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { EducationWhereUniqueInput } from './education-where-unique.input';
import { Type } from 'class-transformer';

@ArgsType()
export class DeleteOneEducationArgs {

    @Field(() => EducationWhereUniqueInput, {nullable:false})
    @Type(() => EducationWhereUniqueInput)
    where!: Prisma.AtLeast<EducationWhereUniqueInput, 'id' | 'name' | 'graduationYear'>;
}
