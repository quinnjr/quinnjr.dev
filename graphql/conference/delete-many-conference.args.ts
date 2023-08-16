import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { ConferenceWhereInput } from './conference-where.input';
import { Type } from 'class-transformer';

@ArgsType()
export class DeleteManyConferenceArgs {

    @Field(() => ConferenceWhereInput, {nullable:true})
    @Type(() => ConferenceWhereInput)
    where?: ConferenceWhereInput;
}
