import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { ExperienceWhereInput } from './experience-where.input';
import { Type } from 'class-transformer';

@ArgsType()
export class DeleteManyExperienceArgs {

    @Field(() => ExperienceWhereInput, {nullable:true})
    @Type(() => ExperienceWhereInput)
    where?: ExperienceWhereInput;
}
