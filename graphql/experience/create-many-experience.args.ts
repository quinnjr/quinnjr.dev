import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { ExperienceCreateManyInput } from './experience-create-many.input';
import { Type } from 'class-transformer';

@ArgsType()
export class CreateManyExperienceArgs {

    @Field(() => [ExperienceCreateManyInput], {nullable:false})
    @Type(() => ExperienceCreateManyInput)
    data!: Array<ExperienceCreateManyInput>;

    @Field(() => Boolean, {nullable:true})
    skipDuplicates?: boolean;
}
