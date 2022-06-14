import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { Int } from '@nestjs/graphql';
import { EducationCreateactivitiesInput } from './education-createactivities.input';

@InputType()
export class EducationCreateManyUserInput {

    @Field(() => String, {nullable:true})
    id?: string;

    @Field(() => String, {nullable:false})
    name!: string;

    @Field(() => String, {nullable:false})
    location!: string;

    @Field(() => String, {nullable:false})
    degree!: string;

    @Field(() => Date, {nullable:true})
    startYear?: Date | string;

    @Field(() => Int, {nullable:true})
    graduationYear?: number;

    @Field(() => EducationCreateactivitiesInput, {nullable:true})
    activities?: EducationCreateactivitiesInput;

    @Field(() => String, {nullable:false})
    campusImage!: string;

    @Field(() => String, {nullable:false})
    url!: string;
}
