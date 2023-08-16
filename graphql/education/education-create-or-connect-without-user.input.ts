import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { EducationWhereUniqueInput } from './education-where-unique.input';
import { Type } from 'class-transformer';
import { EducationCreateWithoutUserInput } from './education-create-without-user.input';

@InputType()
export class EducationCreateOrConnectWithoutUserInput {

    @Field(() => EducationWhereUniqueInput, {nullable:false})
    @Type(() => EducationWhereUniqueInput)
    where!: Prisma.AtLeast<EducationWhereUniqueInput, 'id' | 'name' | 'graduationYear'>;

    @Field(() => EducationCreateWithoutUserInput, {nullable:false})
    @Type(() => EducationCreateWithoutUserInput)
    create!: EducationCreateWithoutUserInput;
}
