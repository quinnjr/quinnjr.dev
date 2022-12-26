import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { ConferenceWhereUniqueInput } from '../conference/conference-where-unique.input';

@ArgsType()
export class FindUniqueConferenceOrThrowArgs {

    @Field(() => ConferenceWhereUniqueInput, {nullable:false})
    where!: ConferenceWhereUniqueInput;
}
