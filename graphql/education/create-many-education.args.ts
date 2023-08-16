import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { EducationCreateManyInput } from './education-create-many.input';
import { Type } from 'class-transformer';

@ArgsType()
export class CreateManyEducationArgs {

    @Field(() => [EducationCreateManyInput], {nullable:false})
    @Type(() => EducationCreateManyInput)
    data!: Array<EducationCreateManyInput>;

    @Field(() => Boolean, {nullable:true})
    skipDuplicates?: boolean;
}
