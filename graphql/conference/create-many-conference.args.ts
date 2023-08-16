import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { ConferenceCreateManyInput } from './conference-create-many.input';
import { Type } from 'class-transformer';

@ArgsType()
export class CreateManyConferenceArgs {

    @Field(() => [ConferenceCreateManyInput], {nullable:false})
    @Type(() => ConferenceCreateManyInput)
    data!: Array<ConferenceCreateManyInput>;

    @Field(() => Boolean, {nullable:true})
    skipDuplicates?: boolean;
}
