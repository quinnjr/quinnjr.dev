import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { CertificationScalarWhereInput } from './certification-scalar-where.input';
import { Type } from 'class-transformer';
import { CertificationUpdateManyMutationInput } from './certification-update-many-mutation.input';

@InputType()
export class CertificationUpdateManyWithWhereWithoutUserInput {

    @Field(() => CertificationScalarWhereInput, {nullable:false})
    @Type(() => CertificationScalarWhereInput)
    where!: CertificationScalarWhereInput;

    @Field(() => CertificationUpdateManyMutationInput, {nullable:false})
    @Type(() => CertificationUpdateManyMutationInput)
    data!: CertificationUpdateManyMutationInput;
}
