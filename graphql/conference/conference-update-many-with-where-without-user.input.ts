import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { ConferenceScalarWhereInput } from './conference-scalar-where.input';
import { Type } from 'class-transformer';
import { ConferenceUpdateManyMutationInput } from './conference-update-many-mutation.input';

@InputType()
export class ConferenceUpdateManyWithWhereWithoutUserInput {

    @Field(() => ConferenceScalarWhereInput, {nullable:false})
    @Type(() => ConferenceScalarWhereInput)
    where!: ConferenceScalarWhereInput;

    @Field(() => ConferenceUpdateManyMutationInput, {nullable:false})
    @Type(() => ConferenceUpdateManyMutationInput)
    data!: ConferenceUpdateManyMutationInput;
}
