import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { CertificationWhereInput } from './certification-where.input';
import { StringFilter } from '../prisma/string-filter.input';
import { UuidFilter } from '../prisma/uuid-filter.input';
import { UserRelationFilter } from '../user/user-relation-filter.input';

@InputType()
export class CertificationWhereUniqueInput {

    @Field(() => String, {nullable:true})
    id?: string;

    @Field(() => String, {nullable:true})
    name?: string;

    @Field(() => [CertificationWhereInput], {nullable:true})
    AND?: Array<CertificationWhereInput>;

    @Field(() => [CertificationWhereInput], {nullable:true})
    OR?: Array<CertificationWhereInput>;

    @Field(() => [CertificationWhereInput], {nullable:true})
    NOT?: Array<CertificationWhereInput>;

    @Field(() => StringFilter, {nullable:true})
    certifier?: StringFilter;

    @Field(() => UuidFilter, {nullable:true})
    userId?: UuidFilter;

    @Field(() => UserRelationFilter, {nullable:true})
    user?: UserRelationFilter;
}
