import { Field } from '@nestjs/graphql';
import { ArgsType } from '@nestjs/graphql';
import { UserWhereUniqueInput } from '../user/user-where-unique.input';

@ArgsType()
export class FindUniqueUserOrThrowArgs {

    @Field(() => UserWhereUniqueInput, {nullable:false})
    where!: UserWhereUniqueInput;
}
