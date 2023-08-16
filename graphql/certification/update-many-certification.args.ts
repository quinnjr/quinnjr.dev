import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { CertificationUpdateManyMutationInput } from './certification-update-many-mutation.input';
import { Type } from 'class-transformer';
import { CertificationWhereInput } from './certification-where.input';

@ArgsType()
export class UpdateManyCertificationArgs {

    @Field(() => CertificationUpdateManyMutationInput, {nullable:false})
    @Type(() => CertificationUpdateManyMutationInput)
    data!: CertificationUpdateManyMutationInput;

    @Field(() => CertificationWhereInput, {nullable:true})
    @Type(() => CertificationWhereInput)
    where?: CertificationWhereInput;
}
