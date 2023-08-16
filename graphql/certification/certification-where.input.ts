import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { UuidFilter } from '../prisma/uuid-filter.input';
import { StringFilter } from '../prisma/string-filter.input';
import { UserRelationFilter } from '../user/user-relation-filter.input';

@InputType()
export class CertificationWhereInput {

    @Field(() => [CertificationWhereInput], {nullable:true})
    AND?: Array<CertificationWhereInput>;

    @Field(() => [CertificationWhereInput], {nullable:true})
    OR?: Array<CertificationWhereInput>;

    @Field(() => [CertificationWhereInput], {nullable:true})
    NOT?: Array<CertificationWhereInput>;

    @Field(() => UuidFilter, {nullable:true})
    id?: UuidFilter;

    @Field(() => StringFilter, {nullable:true})
    name?: StringFilter;

    @Field(() => StringFilter, {nullable:true})
    certifier?: StringFilter;

    @Field(() => UuidFilter, {nullable:true})
    userId?: UuidFilter;

    @Field(() => UserRelationFilter, {nullable:true})
    user?: UserRelationFilter;
}
