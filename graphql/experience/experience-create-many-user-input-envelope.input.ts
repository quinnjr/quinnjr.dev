import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { ExperienceCreateManyUserInput } from './experience-create-many-user.input';
import { Type } from 'class-transformer';

@InputType()
export class ExperienceCreateManyUserInputEnvelope {

    @Field(() => [ExperienceCreateManyUserInput], {nullable:false})
    @Type(() => ExperienceCreateManyUserInput)
    data!: Array<ExperienceCreateManyUserInput>;

    @Field(() => Boolean, {nullable:true})
    skipDuplicates?: boolean;
}
