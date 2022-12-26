import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { CertificationWhereUniqueInput } from '../certification/certification-where-unique.input';

@ArgsType()
export class FindUniqueCertificationOrThrowArgs {

    @Field(() => CertificationWhereUniqueInput, {nullable:false})
    where!: CertificationWhereUniqueInput;
}
