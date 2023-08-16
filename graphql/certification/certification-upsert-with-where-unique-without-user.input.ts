import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { CertificationWhereUniqueInput } from './certification-where-unique.input';
import { Type } from 'class-transformer';
import { CertificationUpdateWithoutUserInput } from './certification-update-without-user.input';
import { CertificationCreateWithoutUserInput } from './certification-create-without-user.input';

@InputType()
export class CertificationUpsertWithWhereUniqueWithoutUserInput {

    @Field(() => CertificationWhereUniqueInput, {nullable:false})
    @Type(() => CertificationWhereUniqueInput)
    where!: Prisma.AtLeast<CertificationWhereUniqueInput, 'id' | 'name'>;

    @Field(() => CertificationUpdateWithoutUserInput, {nullable:false})
    @Type(() => CertificationUpdateWithoutUserInput)
    update!: CertificationUpdateWithoutUserInput;

    @Field(() => CertificationCreateWithoutUserInput, {nullable:false})
    @Type(() => CertificationCreateWithoutUserInput)
    create!: CertificationCreateWithoutUserInput;
}
