import { test, expect } from '../fixtures/auth.fixture.ts';
import ENV from '../utility/env.ts';
import {newToolCreateData, endpoints,updateToolData} from '../utility/data.ts';





test.describe('Users API', () => {
  
let createdToolResponse: any;


 test('should get list of users', async ({ api}) => {
    const response = await api.get(endpoints().usersEndpoint);
    const data = await response.json();
    console.log(response.statusText());
    console.log(data);
    expect(response.status()).toBe(200);
    
    
  });

 test('Create new tool', async ({ api }) => {
    const newTool = newToolCreateData(process.env.test_env);
    const response = await api.post(endpoints().toolsEndpoint, newTool);
     console.log(response.statusText());
    createdToolResponse = await response.json();
    console.log(createdToolResponse);
    expect(response.status()).toBe(201);
    expect(createdToolResponse.name).toBe(newTool.name);
    
  });




   test('Update tool', async ({ api }) => {

    const updatetoolData = updateToolData();
    updatetoolData.connectorId = createdToolResponse.connectorId;
    updatetoolData.bodyTemplate.url = `${ENV.BASE_URL}`;
    updatetoolData.bodyTemplate.headers.Authorization = `${ENV.TOKEN}`;
    const response = await api.put(`${endpoints().toolsEndpoint}/${createdToolResponse.id}`, updatetoolData);
    const updatedToolResponse = await response.json();
    console.log(response.statusText());
    console.log(updatedToolResponse);
    expect(response.status()).toBe(200);
    expect(updatedToolResponse.name).toBe(updatetoolData.name);
    
  });

  test('Delete tool', async ({ api }) => {

    console.log('Deleting tool with ID:', createdToolResponse.id);
    const response = await api.del(`${endpoints().toolsEndpoint}/${createdToolResponse.id}`);
    console.log(response.statusText()); 
    expect(response.status()).toBe(204);
  });
  
  });

