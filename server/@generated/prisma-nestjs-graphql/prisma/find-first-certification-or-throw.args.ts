import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { CertificationWhereInput } from '../certification/certification-where.input';
import { CertificationOrderByWithRelationInput } from '../certification/certification-order-by-with-relation.input';
import { CertificationWhereUniqueInput } from '../certification/certification-where-unique.input';
import { Int } from '@nestjs/graphql';
import { CertificationScalarFieldEnum } from '../certification/certification-scalar-field.enum';

@ArgsType()
export class FindFirstCertificationOrThrowArgs {

    @Field(() => CertificationWhereInput, {nullable:true})
    where?: CertificationWhereInput;

    @Field(() => [CertificationOrderByWithRelationInput], {nullable:true})
    orderBy?: Array<CertificationOrderByWithRelationInput>;

    @Field(() => CertificationWhereUniqueInput, {nullable:true})
    cursor?: CertificationWhereUniqueInput;

    @Field(() => Int, {nullable:true})
    take?: number;

    @Field(() => Int, {nullable:true})
    skip?: number;

    @Field(() => [CertificationScalarFieldEnum], {nullable:true})
    distinct?: Array<keyof typeof CertificationScalarFieldEnum>;
}
