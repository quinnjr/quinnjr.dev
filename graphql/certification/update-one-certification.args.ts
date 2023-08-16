import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { CertificationUpdateInput } from './certification-update.input';
import { Type } from 'class-transformer';
import { Prisma } from '@prisma/client';
import { CertificationWhereUniqueInput } from './certification-where-unique.input';

@ArgsType()
export class UpdateOneCertificationArgs {

    @Field(() => CertificationUpdateInput, {nullable:false})
    @Type(() => CertificationUpdateInput)
    data!: CertificationUpdateInput;

    @Field(() => CertificationWhereUniqueInput, {nullable:false})
    @Type(() => CertificationWhereUniqueInput)
    where!: Prisma.AtLeast<CertificationWhereUniqueInput, 'id' | 'name'>;
}
