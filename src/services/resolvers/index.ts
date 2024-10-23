import categoryResolvers from "../categories/categoriesResolvers";
import productResolvers from "../products/productsResolvers";
import userResolvers from "../users/resolvers";

const resolvers = {
    Query: {
      // Add your query resolvers here
      ...categoryResolvers.Query,
      ...userResolvers.Query
    //   ...productResolvers.Query
    },
    Mutation: {
        ...categoryResolvers.Mutation,
        ...productResolvers.Mutation,
        ...userResolvers.Mutation
      // Add your mutation resolvers here
    },
    // Add any custom scalar types, subscriptions, or other resolver objects if needed
  };
  
  export default resolvers;
  