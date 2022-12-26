import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { EducationWhereInput } from '../education/education-where.input';
import { EducationOrderByWithRelationInput } from '../education/education-order-by-with-relation.input';
import { EducationWhereUniqueInput } from '../education/education-where-unique.input';
import { Int } from '@nestjs/graphql';
import { EducationScalarFieldEnum } from '../education/education-scalar-field.enum';

@ArgsType()
export class FindFirstEducationOrThrowArgs {

    @Field(() => EducationWhereInput, {nullable:true})
    where?: EducationWhereInput;

    @Field(() => [EducationOrderByWithRelationInput], {nullable:true})
    orderBy?: Array<EducationOrderByWithRelationInput>;

    @Field(() => EducationWhereUniqueInput, {nullable:true})
    cursor?: EducationWhereUniqueInput;

    @Field(() => Int, {nullable:true})
    take?: number;

    @Field(() => Int, {nullable:true})
    skip?: number;

    @Field(() => [EducationScalarFieldEnum], {nullable:true})
    distinct?: Array<keyof typeof EducationScalarFieldEnum>;
}
