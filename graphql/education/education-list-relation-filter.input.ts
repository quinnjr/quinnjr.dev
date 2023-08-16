import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { EducationWhereInput } from './education-where.input';

@InputType()
export class EducationListRelationFilter {

    @Field(() => EducationWhereInput, {nullable:true})
    every?: EducationWhereInput;

    @Field(() => EducationWhereInput, {nullable:true})
    some?: EducationWhereInput;

    @Field(() => EducationWhereInput, {nullable:true})
    none?: EducationWhereInput;
}
