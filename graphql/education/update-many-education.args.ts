import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { EducationUpdateManyMutationInput } from './education-update-many-mutation.input';
import { Type } from 'class-transformer';
import { EducationWhereInput } from './education-where.input';

@ArgsType()
export class UpdateManyEducationArgs {

    @Field(() => EducationUpdateManyMutationInput, {nullable:false})
    @Type(() => EducationUpdateManyMutationInput)
    data!: EducationUpdateManyMutationInput;

    @Field(() => EducationWhereInput, {nullable:true})
    @Type(() => EducationWhereInput)
    where?: EducationWhereInput;
}
