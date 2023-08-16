import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { CertificationCreateManyUserInput } from './certification-create-many-user.input';
import { Type } from 'class-transformer';

@InputType()
export class CertificationCreateManyUserInputEnvelope {

    @Field(() => [CertificationCreateManyUserInput], {nullable:false})
    @Type(() => CertificationCreateManyUserInput)
    data!: Array<CertificationCreateManyUserInput>;

    @Field(() => Boolean, {nullable:true})
    skipDuplicates?: boolean;
}
