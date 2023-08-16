import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { ExperienceCreateInput } from './experience-create.input';
import { Type } from 'class-transformer';

@ArgsType()
export class CreateOneExperienceArgs {

    @Field(() => ExperienceCreateInput, {nullable:false})
    @Type(() => ExperienceCreateInput)
    data!: ExperienceCreateInput;
}
