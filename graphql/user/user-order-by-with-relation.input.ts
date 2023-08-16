import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { SortOrder } from '../prisma/sort-order.enum';
import { HideField } from '@nestjs/graphql';
import { SortOrderInput } from '../prisma/sort-order.input';
import { ArticleOrderByRelationAggregateInput } from '../article/article-order-by-relation-aggregate.input';
import { ExperienceOrderByRelationAggregateInput } from '../experience/experience-order-by-relation-aggregate.input';
import { EducationOrderByRelationAggregateInput } from '../education/education-order-by-relation-aggregate.input';
import { CertificationOrderByRelationAggregateInput } from '../certification/certification-order-by-relation-aggregate.input';
import { ProjectOrderByRelationAggregateInput } from '../project/project-order-by-relation-aggregate.input';
import { ConferenceOrderByRelationAggregateInput } from '../conference/conference-order-by-relation-aggregate.input';

@InputType()
export class UserOrderByWithRelationInput {

    @Field(() => SortOrder, {nullable:true})
    id?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    email?: keyof typeof SortOrder;

    @HideField()
    passwordHash?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    firstName?: keyof typeof SortOrder;

    @Field(() => SortOrderInput, {nullable:true})
    middleName?: SortOrderInput;

    @Field(() => SortOrder, {nullable:true})
    lastName?: keyof typeof SortOrder;

    @Field(() => SortOrderInput, {nullable:true})
    website?: SortOrderInput;

    @Field(() => SortOrderInput, {nullable:true})
    linkedin?: SortOrderInput;

    @Field(() => SortOrderInput, {nullable:true})
    github?: SortOrderInput;

    @Field(() => SortOrderInput, {nullable:true})
    profilePicture?: SortOrderInput;

    @Field(() => SortOrder, {nullable:true})
    profile?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    profileHighlights?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    birthday?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    skills?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    yubikeys?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    professionalMemberships?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    role?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    createdAt?: keyof typeof SortOrder;

    @Field(() => SortOrder, {nullable:true})
    updatedAt?: keyof typeof SortOrder;

    @Field(() => ArticleOrderByRelationAggregateInput, {nullable:true})
    articles?: ArticleOrderByRelationAggregateInput;

    @Field(() => ExperienceOrderByRelationAggregateInput, {nullable:true})
    experiences?: ExperienceOrderByRelationAggregateInput;

    @Field(() => EducationOrderByRelationAggregateInput, {nullable:true})
    educations?: EducationOrderByRelationAggregateInput;

    @Field(() => CertificationOrderByRelationAggregateInput, {nullable:true})
    certifications?: CertificationOrderByRelationAggregateInput;

    @Field(() => ProjectOrderByRelationAggregateInput, {nullable:true})
    projects?: ProjectOrderByRelationAggregateInput;

    @Field(() => ConferenceOrderByRelationAggregateInput, {nullable:true})
    conferences?: ConferenceOrderByRelationAggregateInput;
}
