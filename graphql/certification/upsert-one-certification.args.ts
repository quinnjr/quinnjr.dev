import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { CertificationWhereUniqueInput } from './certification-where-unique.input';
import { Type } from 'class-transformer';
import { CertificationCreateInput } from './certification-create.input';
import { CertificationUpdateInput } from './certification-update.input';

@ArgsType()
export class UpsertOneCertificationArgs {

    @Field(() => CertificationWhereUniqueInput, {nullable:false})
    @Type(() => CertificationWhereUniqueInput)
    where!: Prisma.AtLeast<CertificationWhereUniqueInput, 'id' | 'name'>;

    @Field(() => CertificationCreateInput, {nullable:false})
    @Type(() => CertificationCreateInput)
    create!: CertificationCreateInput;

    @Field(() => CertificationUpdateInput, {nullable:false})
    @Type(() => CertificationUpdateInput)
    update!: CertificationUpdateInput;
}
