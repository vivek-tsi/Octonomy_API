import { faker } from "@faker-js/faker";

export function newToolCreateData(ds?: string) {
  const data: Record<string, any> = {
    name: faker.string.alpha({ length: { min: 5, max: 7 } }),
    type: "ENDPOINT",
    description: faker.string.alpha({ length: { min: 5, max: 7 } }),
  };

  if (ds === "test") {
    data.connectorId = "16fc8c3f-ab91-40a2-a71a-ac317876fa46";
  } else if (ds === "stg") {
    data.connectorId = "076d674c-95fe-4799-9015-51c106b4aff7";
  }

  return data;
}

export function endpoints() {
  return {
    usersEndpoint: '/api/appconnect/users?role=SUPER_ADMIN&role=END_USER&role=SUPERVISOR&role=ANONYMOUS&page=1&limit=10',
    toolsEndpoint: '/api/appconnect/tools',
    connectorsEndpoint: '/api/appconnect/connectors',
  };
}

export function loginData() {
const LOGIN = {
  selectors: {
    msLink: "//span[text()='Sign in with Microsoft']",
    emailField: "//input[@type='email']",
    nextBtn: "//input[@value='Next']",
    passwordField: "//input[@name='passwd']",
    signInBtn: "//input[@value='Sign in']",
    yesBtn: "//input[@value='Yes']",
  },

  user: {
    email: "quickstep-qa-user-01@talentship.io",
    password: "Octo@001"
  },
};


return LOGIN;
}

export function updateToolData() {
  return {
    
  "name": "Updated Tool Name",
  "description": "Updated tool description",
  "connectorId": "",
  "connectorType": "HTTP_CONNECTOR",
  "version": "v2",
  "method": "POST",
  "bodyTemplate": {
    "url": "",
    "headers": {
      "Authorization": ""
    }
  
  },
  "status": "ACTIVE",
  "params": [
    {
      "toolId": "tool-uuid-1",
      "name": "userId",
      "description": "The ID of the user",
      "type": "STRING",
      "usageIn": "BODY",
      "required": true,
      "multi": false,
      "position": 1,
      "validation": {
        "minLength": 10,
        "maxLength": 10
      }
    }
  ]
}
  };
