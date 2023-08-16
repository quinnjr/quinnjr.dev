import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { ConferenceCreateInput } from './conference-create.input';
import { Type } from 'class-transformer';

@ArgsType()
export class CreateOneConferenceArgs {

    @Field(() => ConferenceCreateInput, {nullable:false})
    @Type(() => ConferenceCreateInput)
    data!: ConferenceCreateInput;
}
