import { gql } from "apollo-server-express";

const settingsTypedefs = gql`
  type ApplicationSettings {
    id: Int!
    comingSoon: Boolean!
    maintenance: Boolean!
  }

  type Query {
    getApplicationSettings: ApplicationSettings
  }

  type Mutation {
    updateApplicationSettings(
      comingSoon: Boolean
      maintenance: Boolean
    ): ApplicationSettings
  }
`;

export default settingsTypedefs;
