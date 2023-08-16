import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { ProjectCreateManyUserInput } from './project-create-many-user.input';
import { Type } from 'class-transformer';

@InputType()
export class ProjectCreateManyUserInputEnvelope {

    @Field(() => [ProjectCreateManyUserInput], {nullable:false})
    @Type(() => ProjectCreateManyUserInput)
    data!: Array<ProjectCreateManyUserInput>;

    @Field(() => Boolean, {nullable:true})
    skipDuplicates?: boolean;
}
