import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { CertificationCreateWithoutUserInput } from './certification-create-without-user.input';
import { CertificationCreateOrConnectWithoutUserInput } from './certification-create-or-connect-without-user.input';
import { CertificationUpsertWithWhereUniqueWithoutUserInput } from './certification-upsert-with-where-unique-without-user.input';
import { CertificationCreateManyUserInputEnvelope } from './certification-create-many-user-input-envelope.input';
import { CertificationWhereUniqueInput } from './certification-where-unique.input';
import { CertificationUpdateWithWhereUniqueWithoutUserInput } from './certification-update-with-where-unique-without-user.input';
import { CertificationUpdateManyWithWhereWithoutUserInput } from './certification-update-many-with-where-without-user.input';
import { CertificationScalarWhereInput } from './certification-scalar-where.input';

@InputType()
export class CertificationUncheckedUpdateManyWithoutUserNestedInput {

    @Field(() => [CertificationCreateWithoutUserInput], {nullable:true})
    create?: Array<CertificationCreateWithoutUserInput>;

    @Field(() => [CertificationCreateOrConnectWithoutUserInput], {nullable:true})
    connectOrCreate?: Array<CertificationCreateOrConnectWithoutUserInput>;

    @Field(() => [CertificationUpsertWithWhereUniqueWithoutUserInput], {nullable:true})
    upsert?: Array<CertificationUpsertWithWhereUniqueWithoutUserInput>;

    @Field(() => CertificationCreateManyUserInputEnvelope, {nullable:true})
    createMany?: CertificationCreateManyUserInputEnvelope;

    @Field(() => [CertificationWhereUniqueInput], {nullable:true})
    set?: Array<CertificationWhereUniqueInput>;

    @Field(() => [CertificationWhereUniqueInput], {nullable:true})
    disconnect?: Array<CertificationWhereUniqueInput>;

    @Field(() => [CertificationWhereUniqueInput], {nullable:true})
    delete?: Array<CertificationWhereUniqueInput>;

    @Field(() => [CertificationWhereUniqueInput], {nullable:true})
    connect?: Array<CertificationWhereUniqueInput>;

    @Field(() => [CertificationUpdateWithWhereUniqueWithoutUserInput], {nullable:true})
    update?: Array<CertificationUpdateWithWhereUniqueWithoutUserInput>;

    @Field(() => [CertificationUpdateManyWithWhereWithoutUserInput], {nullable:true})
    updateMany?: Array<CertificationUpdateManyWithWhereWithoutUserInput>;

    @Field(() => [CertificationScalarWhereInput], {nullable:true})
    deleteMany?: Array<CertificationScalarWhereInput>;
}
