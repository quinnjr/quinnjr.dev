import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { CertificationCreateWithoutUserInput } from './certification-create-without-user.input';
import { Type } from 'class-transformer';
import { CertificationCreateOrConnectWithoutUserInput } from './certification-create-or-connect-without-user.input';
import { CertificationCreateManyUserInputEnvelope } from './certification-create-many-user-input-envelope.input';
import { Prisma } from '@prisma/client';
import { CertificationWhereUniqueInput } from './certification-where-unique.input';

@InputType()
export class CertificationUncheckedCreateNestedManyWithoutUserInput {

    @Field(() => [CertificationCreateWithoutUserInput], {nullable:true})
    @Type(() => CertificationCreateWithoutUserInput)
    create?: Array<CertificationCreateWithoutUserInput>;

    @Field(() => [CertificationCreateOrConnectWithoutUserInput], {nullable:true})
    @Type(() => CertificationCreateOrConnectWithoutUserInput)
    connectOrCreate?: Array<CertificationCreateOrConnectWithoutUserInput>;

    @Field(() => CertificationCreateManyUserInputEnvelope, {nullable:true})
    @Type(() => CertificationCreateManyUserInputEnvelope)
    createMany?: CertificationCreateManyUserInputEnvelope;

    @Field(() => [CertificationWhereUniqueInput], {nullable:true})
    @Type(() => CertificationWhereUniqueInput)
    connect?: Array<Prisma.AtLeast<CertificationWhereUniqueInput, 'id' | 'name'>>;
}
