import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { CertificationCreateInput } from './certification-create.input';
import { Type } from 'class-transformer';

@ArgsType()
export class CreateOneCertificationArgs {

    @Field(() => CertificationCreateInput, {nullable:false})
    @Type(() => CertificationCreateInput)
    data!: CertificationCreateInput;
}
