const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const jwt = require('jsonwebtoken');
const { typeDefs } = require('./schema');
const { resolvers } = require('./resolvers');
const User = require('../models/User');

let apolloServer;

const createApolloServer = () => {
  return new ApolloServer({
    typeDefs,
    resolvers,
  });
};

const initGraphQL = async (app) => {
  if (!apolloServer) {
    apolloServer = createApolloServer();
    await apolloServer.start();

    app.use(
      '/graphql',
      expressMiddleware(apolloServer, {
        context: async ({ req }) => {
          let user = null;
          const authHeader = req.headers.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
              const decoded = jwt.verify(token, process.env.JWT_SECRET);
              user = await User.findById(decoded.id);
            } catch (_) {
              // Token invalid or expired: user remains null
            }
          }
          return { user, req };
        },
      })
    );
  }
  return apolloServer;
};

const getApolloServer = () => apolloServer;

module.exports = {
  createApolloServer,
  initGraphQL,
  getApolloServer,
};

