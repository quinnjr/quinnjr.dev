import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { ConferenceUpdateManyMutationInput } from './conference-update-many-mutation.input';
import { Type } from 'class-transformer';
import { ConferenceWhereInput } from './conference-where.input';

@ArgsType()
export class UpdateManyConferenceArgs {

    @Field(() => ConferenceUpdateManyMutationInput, {nullable:false})
    @Type(() => ConferenceUpdateManyMutationInput)
    data!: ConferenceUpdateManyMutationInput;

    @Field(() => ConferenceWhereInput, {nullable:true})
    @Type(() => ConferenceWhereInput)
    where?: ConferenceWhereInput;
}
