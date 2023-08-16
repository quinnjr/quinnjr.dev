import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { EducationWhereUniqueInput } from './education-where-unique.input';
import { Type } from 'class-transformer';
import { EducationCreateInput } from './education-create.input';
import { EducationUpdateInput } from './education-update.input';

@ArgsType()
export class UpsertOneEducationArgs {

    @Field(() => EducationWhereUniqueInput, {nullable:false})
    @Type(() => EducationWhereUniqueInput)
    where!: Prisma.AtLeast<EducationWhereUniqueInput, 'id' | 'name' | 'graduationYear'>;

    @Field(() => EducationCreateInput, {nullable:false})
    @Type(() => EducationCreateInput)
    create!: EducationCreateInput;

    @Field(() => EducationUpdateInput, {nullable:false})
    @Type(() => EducationUpdateInput)
    update!: EducationUpdateInput;
}
