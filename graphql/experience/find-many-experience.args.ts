import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { ExperienceWhereInput } from './experience-where.input';
import { Type } from 'class-transformer';
import { ExperienceOrderByWithRelationInput } from './experience-order-by-with-relation.input';
import { Prisma } from '@prisma/client';
import { ExperienceWhereUniqueInput } from './experience-where-unique.input';
import { Int } from '@nestjs/graphql';
import { ExperienceScalarFieldEnum } from './experience-scalar-field.enum';

@ArgsType()
export class FindManyExperienceArgs {

    @Field(() => ExperienceWhereInput, {nullable:true})
    @Type(() => ExperienceWhereInput)
    where?: ExperienceWhereInput;

    @Field(() => [ExperienceOrderByWithRelationInput], {nullable:true})
    orderBy?: Array<ExperienceOrderByWithRelationInput>;

    @Field(() => ExperienceWhereUniqueInput, {nullable:true})
    cursor?: Prisma.AtLeast<ExperienceWhereUniqueInput, 'id'>;

    @Field(() => Int, {nullable:true})
    take?: number;

    @Field(() => Int, {nullable:true})
    skip?: number;

    @Field(() => [ExperienceScalarFieldEnum], {nullable:true})
    distinct?: Array<keyof typeof ExperienceScalarFieldEnum>;
}
