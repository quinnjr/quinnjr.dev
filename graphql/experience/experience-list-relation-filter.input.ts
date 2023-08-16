import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { ExperienceWhereInput } from './experience-where.input';

@InputType()
export class ExperienceListRelationFilter {

    @Field(() => ExperienceWhereInput, {nullable:true})
    every?: ExperienceWhereInput;

    @Field(() => ExperienceWhereInput, {nullable:true})
    some?: ExperienceWhereInput;

    @Field(() => ExperienceWhereInput, {nullable:true})
    none?: ExperienceWhereInput;
}
