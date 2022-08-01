import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { EducationCreateWithoutUserInput } from './education-create-without-user.input';
import { EducationCreateOrConnectWithoutUserInput } from './education-create-or-connect-without-user.input';
import { EducationUpsertWithWhereUniqueWithoutUserInput } from './education-upsert-with-where-unique-without-user.input';
import { EducationCreateManyUserInputEnvelope } from './education-create-many-user-input-envelope.input';
import { EducationWhereUniqueInput } from './education-where-unique.input';
import { EducationUpdateWithWhereUniqueWithoutUserInput } from './education-update-with-where-unique-without-user.input';
import { EducationUpdateManyWithWhereWithoutUserInput } from './education-update-many-with-where-without-user.input';
import { EducationScalarWhereInput } from './education-scalar-where.input';

@InputType()
export class EducationUncheckedUpdateManyWithoutUserNestedInput {

    @Field(() => [EducationCreateWithoutUserInput], {nullable:true})
    create?: Array<EducationCreateWithoutUserInput>;

    @Field(() => [EducationCreateOrConnectWithoutUserInput], {nullable:true})
    connectOrCreate?: Array<EducationCreateOrConnectWithoutUserInput>;

    @Field(() => [EducationUpsertWithWhereUniqueWithoutUserInput], {nullable:true})
    upsert?: Array<EducationUpsertWithWhereUniqueWithoutUserInput>;

    @Field(() => EducationCreateManyUserInputEnvelope, {nullable:true})
    createMany?: EducationCreateManyUserInputEnvelope;

    @Field(() => [EducationWhereUniqueInput], {nullable:true})
    set?: Array<EducationWhereUniqueInput>;

    @Field(() => [EducationWhereUniqueInput], {nullable:true})
    disconnect?: Array<EducationWhereUniqueInput>;

    @Field(() => [EducationWhereUniqueInput], {nullable:true})
    delete?: Array<EducationWhereUniqueInput>;

    @Field(() => [EducationWhereUniqueInput], {nullable:true})
    connect?: Array<EducationWhereUniqueInput>;

    @Field(() => [EducationUpdateWithWhereUniqueWithoutUserInput], {nullable:true})
    update?: Array<EducationUpdateWithWhereUniqueWithoutUserInput>;

    @Field(() => [EducationUpdateManyWithWhereWithoutUserInput], {nullable:true})
    updateMany?: Array<EducationUpdateManyWithWhereWithoutUserInput>;

    @Field(() => [EducationScalarWhereInput], {nullable:true})
    deleteMany?: Array<EducationScalarWhereInput>;
}
