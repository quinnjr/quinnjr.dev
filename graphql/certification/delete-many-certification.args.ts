import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { CertificationWhereInput } from './certification-where.input';
import { Type } from 'class-transformer';

@ArgsType()
export class DeleteManyCertificationArgs {

    @Field(() => CertificationWhereInput, {nullable:true})
    @Type(() => CertificationWhereInput)
    where?: CertificationWhereInput;
}
