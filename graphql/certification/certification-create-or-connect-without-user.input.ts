import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { CertificationWhereUniqueInput } from './certification-where-unique.input';
import { Type } from 'class-transformer';
import { CertificationCreateWithoutUserInput } from './certification-create-without-user.input';

@InputType()
export class CertificationCreateOrConnectWithoutUserInput {

    @Field(() => CertificationWhereUniqueInput, {nullable:false})
    @Type(() => CertificationWhereUniqueInput)
    where!: Prisma.AtLeast<CertificationWhereUniqueInput, 'id' | 'name'>;

    @Field(() => CertificationCreateWithoutUserInput, {nullable:false})
    @Type(() => CertificationCreateWithoutUserInput)
    create!: CertificationCreateWithoutUserInput;
}
