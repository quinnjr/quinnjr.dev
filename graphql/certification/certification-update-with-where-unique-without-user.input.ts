import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { CertificationWhereUniqueInput } from './certification-where-unique.input';
import { Type } from 'class-transformer';
import { CertificationUpdateWithoutUserInput } from './certification-update-without-user.input';

@InputType()
export class CertificationUpdateWithWhereUniqueWithoutUserInput {

    @Field(() => CertificationWhereUniqueInput, {nullable:false})
    @Type(() => CertificationWhereUniqueInput)
    where!: Prisma.AtLeast<CertificationWhereUniqueInput, 'id' | 'name'>;

    @Field(() => CertificationUpdateWithoutUserInput, {nullable:false})
    @Type(() => CertificationUpdateWithoutUserInput)
    data!: CertificationUpdateWithoutUserInput;
}
