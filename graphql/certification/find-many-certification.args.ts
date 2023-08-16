import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { CertificationWhereInput } from './certification-where.input';
import { Type } from 'class-transformer';
import { CertificationOrderByWithRelationInput } from './certification-order-by-with-relation.input';
import { Prisma } from '@prisma/client';
import { CertificationWhereUniqueInput } from './certification-where-unique.input';
import { Int } from '@nestjs/graphql';
import { CertificationScalarFieldEnum } from './certification-scalar-field.enum';

@ArgsType()
export class FindManyCertificationArgs {

    @Field(() => CertificationWhereInput, {nullable:true})
    @Type(() => CertificationWhereInput)
    where?: CertificationWhereInput;

    @Field(() => [CertificationOrderByWithRelationInput], {nullable:true})
    orderBy?: Array<CertificationOrderByWithRelationInput>;

    @Field(() => CertificationWhereUniqueInput, {nullable:true})
    cursor?: Prisma.AtLeast<CertificationWhereUniqueInput, 'id' | 'name'>;

    @Field(() => Int, {nullable:true})
    take?: number;

    @Field(() => Int, {nullable:true})
    skip?: number;

    @Field(() => [CertificationScalarFieldEnum], {nullable:true})
    distinct?: Array<keyof typeof CertificationScalarFieldEnum>;
}
