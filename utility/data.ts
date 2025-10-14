import { faker } from "@faker-js/faker";

export function newToolCreateData() {
  return {
    name: faker.string.alpha({ length: { min: 5, max: 7 } }),
    type: "ENDPOINT",
    description: faker.string.alpha({ length: { min: 5, max: 7 } }),
    connectorId: "16fc8c3f-ab91-40a2-a71a-ac317876fa46"
    
  };
}

export function generateUpdatedUserData() {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    address: faker.location.city(),
  };
}
