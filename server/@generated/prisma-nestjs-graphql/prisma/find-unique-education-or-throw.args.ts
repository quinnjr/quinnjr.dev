import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { EducationWhereUniqueInput } from '../education/education-where-unique.input';

@ArgsType()
export class FindUniqueEducationOrThrowArgs {

    @Field(() => EducationWhereUniqueInput, {nullable:false})
    where!: EducationWhereUniqueInput;
}
