import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { EducationWhereInput } from './education-where.input';
import { Type } from 'class-transformer';
import { EducationOrderByWithRelationInput } from './education-order-by-with-relation.input';
import { Prisma } from '@prisma/client';
import { EducationWhereUniqueInput } from './education-where-unique.input';
import { Int } from '@nestjs/graphql';
import { EducationScalarFieldEnum } from './education-scalar-field.enum';

@ArgsType()
export class FindFirstEducationOrThrowArgs {

    @Field(() => EducationWhereInput, {nullable:true})
    @Type(() => EducationWhereInput)
    where?: EducationWhereInput;

    @Field(() => [EducationOrderByWithRelationInput], {nullable:true})
    orderBy?: Array<EducationOrderByWithRelationInput>;

    @Field(() => EducationWhereUniqueInput, {nullable:true})
    cursor?: Prisma.AtLeast<EducationWhereUniqueInput, 'id' | 'name' | 'graduationYear'>;

    @Field(() => Int, {nullable:true})
    take?: number;

    @Field(() => Int, {nullable:true})
    skip?: number;

    @Field(() => [EducationScalarFieldEnum], {nullable:true})
    distinct?: Array<keyof typeof EducationScalarFieldEnum>;
}
