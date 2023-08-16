import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { ConferenceCreateManyUserInput } from './conference-create-many-user.input';
import { Type } from 'class-transformer';

@InputType()
export class ConferenceCreateManyUserInputEnvelope {

    @Field(() => [ConferenceCreateManyUserInput], {nullable:false})
    @Type(() => ConferenceCreateManyUserInput)
    data!: Array<ConferenceCreateManyUserInput>;

    @Field(() => Boolean, {nullable:true})
    skipDuplicates?: boolean;
}
