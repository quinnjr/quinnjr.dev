import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { ExperienceWhereUniqueInput } from '../experience/experience-where-unique.input';

@ArgsType()
export class FindUniqueExperienceOrThrowArgs {

    @Field(() => ExperienceWhereUniqueInput, {nullable:false})
    where!: ExperienceWhereUniqueInput;
}
