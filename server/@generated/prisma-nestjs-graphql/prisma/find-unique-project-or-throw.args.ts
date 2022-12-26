import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { ProjectWhereUniqueInput } from '../project/project-where-unique.input';

@ArgsType()
export class FindUniqueProjectOrThrowArgs {

    @Field(() => ProjectWhereUniqueInput, {nullable:false})
    where!: ProjectWhereUniqueInput;
}
