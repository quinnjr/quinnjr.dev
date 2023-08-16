import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { EducationCreateWithoutUserInput } from './education-create-without-user.input';
import { Type } from 'class-transformer';
import { EducationCreateOrConnectWithoutUserInput } from './education-create-or-connect-without-user.input';
import { EducationUpsertWithWhereUniqueWithoutUserInput } from './education-upsert-with-where-unique-without-user.input';
import { EducationCreateManyUserInputEnvelope } from './education-create-many-user-input-envelope.input';
import { Prisma } from '@prisma/client';
import { EducationWhereUniqueInput } from './education-where-unique.input';
import { EducationUpdateWithWhereUniqueWithoutUserInput } from './education-update-with-where-unique-without-user.input';
import { EducationUpdateManyWithWhereWithoutUserInput } from './education-update-many-with-where-without-user.input';
import { EducationScalarWhereInput } from './education-scalar-where.input';

@InputType()
export class EducationUncheckedUpdateManyWithoutUserNestedInput {

    @Field(() => [EducationCreateWithoutUserInput], {nullable:true})
    @Type(() => EducationCreateWithoutUserInput)
    create?: Array<EducationCreateWithoutUserInput>;

    @Field(() => [EducationCreateOrConnectWithoutUserInput], {nullable:true})
    @Type(() => EducationCreateOrConnectWithoutUserInput)
    connectOrCreate?: Array<EducationCreateOrConnectWithoutUserInput>;

    @Field(() => [EducationUpsertWithWhereUniqueWithoutUserInput], {nullable:true})
    @Type(() => EducationUpsertWithWhereUniqueWithoutUserInput)
    upsert?: Array<EducationUpsertWithWhereUniqueWithoutUserInput>;

    @Field(() => EducationCreateManyUserInputEnvelope, {nullable:true})
    @Type(() => EducationCreateManyUserInputEnvelope)
    createMany?: EducationCreateManyUserInputEnvelope;

    @Field(() => [EducationWhereUniqueInput], {nullable:true})
    @Type(() => EducationWhereUniqueInput)
    set?: Array<Prisma.AtLeast<EducationWhereUniqueInput, 'id' | 'name' | 'graduationYear'>>;

    @Field(() => [EducationWhereUniqueInput], {nullable:true})
    @Type(() => EducationWhereUniqueInput)
    disconnect?: Array<Prisma.AtLeast<EducationWhereUniqueInput, 'id' | 'name' | 'graduationYear'>>;

    @Field(() => [EducationWhereUniqueInput], {nullable:true})
    @Type(() => EducationWhereUniqueInput)
    delete?: Array<Prisma.AtLeast<EducationWhereUniqueInput, 'id' | 'name' | 'graduationYear'>>;

    @Field(() => [EducationWhereUniqueInput], {nullable:true})
    @Type(() => EducationWhereUniqueInput)
    connect?: Array<Prisma.AtLeast<EducationWhereUniqueInput, 'id' | 'name' | 'graduationYear'>>;

    @Field(() => [EducationUpdateWithWhereUniqueWithoutUserInput], {nullable:true})
    @Type(() => EducationUpdateWithWhereUniqueWithoutUserInput)
    update?: Array<EducationUpdateWithWhereUniqueWithoutUserInput>;

    @Field(() => [EducationUpdateManyWithWhereWithoutUserInput], {nullable:true})
    @Type(() => EducationUpdateManyWithWhereWithoutUserInput)
    updateMany?: Array<EducationUpdateManyWithWhereWithoutUserInput>;

    @Field(() => [EducationScalarWhereInput], {nullable:true})
    @Type(() => EducationScalarWhereInput)
    deleteMany?: Array<EducationScalarWhereInput>;
}
