import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { EducationCreateInput } from './education-create.input';
import { Type } from 'class-transformer';

@ArgsType()
export class CreateOneEducationArgs {

    @Field(() => EducationCreateInput, {nullable:false})
    @Type(() => EducationCreateInput)
    data!: EducationCreateInput;
}
