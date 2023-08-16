import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { EducationCreateWithoutUserInput } from './education-create-without-user.input';
import { Type } from 'class-transformer';
import { EducationCreateOrConnectWithoutUserInput } from './education-create-or-connect-without-user.input';
import { EducationCreateManyUserInputEnvelope } from './education-create-many-user-input-envelope.input';
import { Prisma } from '@prisma/client';
import { EducationWhereUniqueInput } from './education-where-unique.input';

@InputType()
export class EducationCreateNestedManyWithoutUserInput {

    @Field(() => [EducationCreateWithoutUserInput], {nullable:true})
    @Type(() => EducationCreateWithoutUserInput)
    create?: Array<EducationCreateWithoutUserInput>;

    @Field(() => [EducationCreateOrConnectWithoutUserInput], {nullable:true})
    @Type(() => EducationCreateOrConnectWithoutUserInput)
    connectOrCreate?: Array<EducationCreateOrConnectWithoutUserInput>;

    @Field(() => EducationCreateManyUserInputEnvelope, {nullable:true})
    @Type(() => EducationCreateManyUserInputEnvelope)
    createMany?: EducationCreateManyUserInputEnvelope;

    @Field(() => [EducationWhereUniqueInput], {nullable:true})
    @Type(() => EducationWhereUniqueInput)
    connect?: Array<Prisma.AtLeast<EducationWhereUniqueInput, 'id' | 'name' | 'graduationYear'>>;
}
