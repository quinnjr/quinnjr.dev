import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'schema.graphql',
  documents: ['src/app/**/*.graphql'],
  generates: {
    'src/app/graphql/generated.ts': {
      // Base schema types (inputs, enums, object types) for type-safe use in
      // components that write inline `gql` documents.
      //
      // NOTE: The full typed-operations + Apollo service-class generation
      // (typescript-operations + typescript-apollo-angular) is intentionally
      // deferred: apollo-angular's codegen plugin (v5) is version-skewed against
      // codegen core v7 / typescript plugin v6 and duplicates enum/input type
      // declarations in a single-file output, which breaks the build. Revisit
      // when the apollo-angular codegen plugin catches up, or split base/operation
      // types into separate files with cross-imports.
      plugins: ['typescript'],
    },
  },
};

export default config;
