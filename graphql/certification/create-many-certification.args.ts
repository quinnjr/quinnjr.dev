import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { CertificationCreateManyInput } from './certification-create-many.input';
import { Type } from 'class-transformer';

@ArgsType()
export class CreateManyCertificationArgs {

    @Field(() => [CertificationCreateManyInput], {nullable:false})
    @Type(() => CertificationCreateManyInput)
    data!: Array<CertificationCreateManyInput>;

    @Field(() => Boolean, {nullable:true})
    skipDuplicates?: boolean;
}
