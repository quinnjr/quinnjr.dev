import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { EducationWhereInput } from './education-where.input';
import { Type } from 'class-transformer';

@ArgsType()
export class DeleteManyEducationArgs {

    @Field(() => EducationWhereInput, {nullable:true})
    @Type(() => EducationWhereInput)
    where?: EducationWhereInput;
}
