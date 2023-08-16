import { registerEnumType } from '@nestjs/graphql';

export enum UserScalarFieldEnum {
    id = "id",
    email = "email",
    passwordHash = "passwordHash",
    firstName = "firstName",
    middleName = "middleName",
    lastName = "lastName",
    website = "website",
    linkedin = "linkedin",
    github = "github",
    profilePicture = "profilePicture",
    profile = "profile",
    profileHighlights = "profileHighlights",
    birthday = "birthday",
    skills = "skills",
    yubikeys = "yubikeys",
    professionalMemberships = "professionalMemberships",
    role = "role",
    createdAt = "createdAt",
    updatedAt = "updatedAt"
}


registerEnumType(UserScalarFieldEnum, { name: 'UserScalarFieldEnum', description: undefined })
