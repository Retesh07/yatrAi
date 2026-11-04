const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
  }

  type Event {
    time: String
    title: String
    desc: String
    description: String
    location: String
    duration: String
    category: String
    icon: String
  }

  type Day {
    day: Int
    date: String
    title: String
    theme: String
    travelTip: String
    events: [Event]
  }

  type Hotel {
    name: String
    category: String
    pricePerNight: String
    rating: String
    area: String
  }

  type Restaurant {
    name: String
    cuisine: String
    foodType: String
    rating: Float
    mustTryDish: String
  }

  type Trip {
    id: ID!
    user: ID
    ownerName: String
    fromLocation: String
    destination: String!
    startDate: String!
    endDate: String!
    people: String
    budget: String
    status: String
    isPublic: Boolean
    estimatedCost: String
    days: [Day]
    hotels: [Hotel]
    recommendedHotels: [Hotel]
    restaurants: [Restaurant]
    createdAt: String
    updatedAt: String
  }

  type Query {
    health: String!
    publicTrips(limit: Int): [Trip!]!
    trip(id: ID!): Trip
    myTrips: [Trip!]!
  }
`;

module.exports = { typeDefs };

