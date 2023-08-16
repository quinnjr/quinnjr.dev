import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { ExperienceUpdateManyMutationInput } from './experience-update-many-mutation.input';
import { Type } from 'class-transformer';
import { ExperienceWhereInput } from './experience-where.input';

@ArgsType()
export class UpdateManyExperienceArgs {

    @Field(() => ExperienceUpdateManyMutationInput, {nullable:false})
    @Type(() => ExperienceUpdateManyMutationInput)
    data!: ExperienceUpdateManyMutationInput;

    @Field(() => ExperienceWhereInput, {nullable:true})
    @Type(() => ExperienceWhereInput)
    where?: ExperienceWhereInput;
}
