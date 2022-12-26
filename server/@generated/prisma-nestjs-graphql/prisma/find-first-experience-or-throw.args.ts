import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { ExperienceWhereInput } from '../experience/experience-where.input';
import { ExperienceOrderByWithRelationInput } from '../experience/experience-order-by-with-relation.input';
import { ExperienceWhereUniqueInput } from '../experience/experience-where-unique.input';
import { Int } from '@nestjs/graphql';
import { ExperienceScalarFieldEnum } from '../experience/experience-scalar-field.enum';

@ArgsType()
export class FindFirstExperienceOrThrowArgs {

    @Field(() => ExperienceWhereInput, {nullable:true})
    where?: ExperienceWhereInput;

    @Field(() => [ExperienceOrderByWithRelationInput], {nullable:true})
    orderBy?: Array<ExperienceOrderByWithRelationInput>;

    @Field(() => ExperienceWhereUniqueInput, {nullable:true})
    cursor?: ExperienceWhereUniqueInput;

    @Field(() => Int, {nullable:true})
    take?: number;

    @Field(() => Int, {nullable:true})
    skip?: number;

    @Field(() => [ExperienceScalarFieldEnum], {nullable:true})
    distinct?: Array<keyof typeof ExperienceScalarFieldEnum>;
}
