import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { CertificationWhereInput } from './certification-where.input';

@InputType()
export class CertificationListRelationFilter {

    @Field(() => CertificationWhereInput, {nullable:true})
    every?: CertificationWhereInput;

    @Field(() => CertificationWhereInput, {nullable:true})
    some?: CertificationWhereInput;

    @Field(() => CertificationWhereInput, {nullable:true})
    none?: CertificationWhereInput;
}
