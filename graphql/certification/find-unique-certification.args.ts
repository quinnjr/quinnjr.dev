import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { CertificationWhereUniqueInput } from './certification-where-unique.input';
import { Type } from 'class-transformer';

@ArgsType()
export class FindUniqueCertificationArgs {

    @Field(() => CertificationWhereUniqueInput, {nullable:false})
    @Type(() => CertificationWhereUniqueInput)
    where!: Prisma.AtLeast<CertificationWhereUniqueInput, 'id' | 'name'>;
}
