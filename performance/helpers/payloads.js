/**
 * Realistic payloads for YatrAI performance testing
 */

const DESTINATIONS = [
  'Goa',
  'Jaipur',
  'Manali',
  'Udaipur',
  'Varanasi',
  'Kerala Backwaters',
  'Rishikesh',
  'Ladakh',
  'Ooty',
  'Agra',
];

const BUDGETS = ['Budget', 'Moderate', 'Comfort', 'Luxury'];
const TRAVEL_STYLES = ['Relaxed', 'Adventure', 'Cultural', 'Sightseeing'];

export function getRandomTripPayload(isPublic = false) {
  const destIndex = Math.floor(Math.random() * DESTINATIONS.length);
  const dest = DESTINATIONS[destIndex];

  return {
    fromLocation: 'Delhi',
    destination: dest,
    startDate: '2026-12-01',
    endDate: '2026-12-05',
    people: '2 Travelers',
    budget: BUDGETS[Math.floor(Math.random() * BUDGETS.length)],
    travelStyle: [TRAVEL_STYLES[Math.floor(Math.random() * TRAVEL_STYLES.length)]],
    food: 'veg',
    transport: ['Flight'],
    isPublic: Boolean(isPublic),
  };
}

export const GRAPHQL_QUERIES = {
  health: JSON.stringify({
    query: `query { health }`,
  }),
  publicTrips: JSON.stringify({
    query: `
      query GetPublicTrips {
        publicTrips(limit: 10) {
          id
          destination
          startDate
          endDate
          budget
          ownerName
          isPublic
        }
      }
    `,
  }),
  myTrips: JSON.stringify({
    query: `
      query GetMyTrips {
        myTrips {
          id
          destination
          startDate
          endDate
          status
        }
      }
    `,
  }),
};

