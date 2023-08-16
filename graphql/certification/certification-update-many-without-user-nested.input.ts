import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { CertificationCreateWithoutUserInput } from './certification-create-without-user.input';
import { Type } from 'class-transformer';
import { CertificationCreateOrConnectWithoutUserInput } from './certification-create-or-connect-without-user.input';
import { CertificationUpsertWithWhereUniqueWithoutUserInput } from './certification-upsert-with-where-unique-without-user.input';
import { CertificationCreateManyUserInputEnvelope } from './certification-create-many-user-input-envelope.input';
import { Prisma } from '@prisma/client';
import { CertificationWhereUniqueInput } from './certification-where-unique.input';
import { CertificationUpdateWithWhereUniqueWithoutUserInput } from './certification-update-with-where-unique-without-user.input';
import { CertificationUpdateManyWithWhereWithoutUserInput } from './certification-update-many-with-where-without-user.input';
import { CertificationScalarWhereInput } from './certification-scalar-where.input';

@InputType()
export class CertificationUpdateManyWithoutUserNestedInput {

    @Field(() => [CertificationCreateWithoutUserInput], {nullable:true})
    @Type(() => CertificationCreateWithoutUserInput)
    create?: Array<CertificationCreateWithoutUserInput>;

    @Field(() => [CertificationCreateOrConnectWithoutUserInput], {nullable:true})
    @Type(() => CertificationCreateOrConnectWithoutUserInput)
    connectOrCreate?: Array<CertificationCreateOrConnectWithoutUserInput>;

    @Field(() => [CertificationUpsertWithWhereUniqueWithoutUserInput], {nullable:true})
    @Type(() => CertificationUpsertWithWhereUniqueWithoutUserInput)
    upsert?: Array<CertificationUpsertWithWhereUniqueWithoutUserInput>;

    @Field(() => CertificationCreateManyUserInputEnvelope, {nullable:true})
    @Type(() => CertificationCreateManyUserInputEnvelope)
    createMany?: CertificationCreateManyUserInputEnvelope;

    @Field(() => [CertificationWhereUniqueInput], {nullable:true})
    @Type(() => CertificationWhereUniqueInput)
    set?: Array<Prisma.AtLeast<CertificationWhereUniqueInput, 'id' | 'name'>>;

    @Field(() => [CertificationWhereUniqueInput], {nullable:true})
    @Type(() => CertificationWhereUniqueInput)
    disconnect?: Array<Prisma.AtLeast<CertificationWhereUniqueInput, 'id' | 'name'>>;

    @Field(() => [CertificationWhereUniqueInput], {nullable:true})
    @Type(() => CertificationWhereUniqueInput)
    delete?: Array<Prisma.AtLeast<CertificationWhereUniqueInput, 'id' | 'name'>>;

    @Field(() => [CertificationWhereUniqueInput], {nullable:true})
    @Type(() => CertificationWhereUniqueInput)
    connect?: Array<Prisma.AtLeast<CertificationWhereUniqueInput, 'id' | 'name'>>;

    @Field(() => [CertificationUpdateWithWhereUniqueWithoutUserInput], {nullable:true})
    @Type(() => CertificationUpdateWithWhereUniqueWithoutUserInput)
    update?: Array<CertificationUpdateWithWhereUniqueWithoutUserInput>;

    @Field(() => [CertificationUpdateManyWithWhereWithoutUserInput], {nullable:true})
    @Type(() => CertificationUpdateManyWithWhereWithoutUserInput)
    updateMany?: Array<CertificationUpdateManyWithWhereWithoutUserInput>;

    @Field(() => [CertificationScalarWhereInput], {nullable:true})
    @Type(() => CertificationScalarWhereInput)
    deleteMany?: Array<CertificationScalarWhereInput>;
}
