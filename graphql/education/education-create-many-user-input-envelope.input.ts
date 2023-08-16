import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { EducationCreateManyUserInput } from './education-create-many-user.input';
import { Type } from 'class-transformer';

@InputType()
export class EducationCreateManyUserInputEnvelope {

    @Field(() => [EducationCreateManyUserInput], {nullable:false})
    @Type(() => EducationCreateManyUserInput)
    data!: Array<EducationCreateManyUserInput>;

    @Field(() => Boolean, {nullable:true})
    skipDuplicates?: boolean;
}
