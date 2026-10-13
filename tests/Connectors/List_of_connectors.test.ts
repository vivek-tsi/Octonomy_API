import { test, expect } from '../../fixtures/auth.fixture.ts';
import {
  Endpoints,
  ConnectorTestData,
  ConnectorSql,
} from '../../utility/lists-kb-connector-data.ts';
import { query } from '../../utility/db.ts';
import { qality, SANITY, REGRESSION } from '../../utility/qality/qality-mapping.ts';

test.describe('KB Connector', () => {

  const data = ConnectorTestData();
  let nextCursor: string;

  test('API returns the list of connectors available for Knowledge Base (KB)', qality('OI-12849', [SANITY, REGRESSION]), async ({ api }) => {
    const response = await api.get(Endpoints().listConnectors);
    const body = await response.json();
    console.log(response.statusText());
    console.log(body);

    expect(response.status()).toBe(200);

    const connectors = Array.isArray(body) ? body : body.data;
    expect(Array.isArray(connectors)).toBeTruthy();

    const dbRows = await query(ConnectorSql().listConnectorsWithoutFilters);
    console.log('API connector count:', connectors.length, 'DB row count:', dbRows.length);
    expect(connectors.length).not.toBe(dbRows.length);

    nextCursor = body.nextCursor;
    console.log('nextCursor:', nextCursor);
    expect(nextCursor).toBeTruthy();
  });

  test('KB connectors include mandatory fields', qality('OI-12851', [REGRESSION]), async ({ api }) => {
    const response = await api.get(Endpoints().listConnectors);
    const body = await response.json();
    console.log(response.statusText());
    console.log(body);

    expect(response.status()).toBe(200);

    const connectors = Array.isArray(body) ? body : body.data;
    expect(Array.isArray(connectors)).toBeTruthy();
    expect(connectors.length).toBeGreaterThan(0);

    const mandatoryFields = data.requiredConnectorFields;

    for (const connector of connectors) {
      for (const field of mandatoryFields) {
        expect(connector, `Missing field "${field}" on connector ${connector?.id ?? connector?.name}`).toHaveProperty(field);
      }

      expect(connector.id).toBeTruthy();
      expect(connector.name).toBeTruthy();
      expect(connector.syncStatus).toBeNull();
      expect(connector.integrationType).toBeTruthy();
      expect(typeof connector.isActive).toBe('boolean');
      expect(connector.connectionId).toBeTruthy();
      expect(connector.connectorType).toBeTruthy();
      expect(connector.scope).toBeTruthy();
      expect(connector.webUrl).toBeTruthy();
      expect(connector.logoUrl).toBeTruthy();
    }
  });

  test('KB connector IDs are unique UUIDs', qality('OI-12852', [REGRESSION]), async ({ api }) => {
    const response = await api.get(Endpoints().listConnectors);
    const body = await response.json();
    console.log(response.statusText());
    console.log(body);

    expect(response.status()).toBe(200);

    const connectors = Array.isArray(body) ? body : body.data;
    expect(Array.isArray(connectors)).toBeTruthy();
    expect(connectors.length).toBeGreaterThan(0);

    const connectorIds = connectors.map((connector: any) => connector.id);
    const uuidPattern = data.uuidRegex;

    for (const id of connectorIds) {
      expect(id, `Invalid UUID: ${id}`).toMatch(uuidPattern);
    }

    expect(new Set(connectorIds).size).toBe(connectorIds.length);
  });



  test('KB connectors isActive is boolean', qality('OI-12854', [REGRESSION]), async ({ api }) => {
    const response = await api.get(Endpoints().listConnectors);
    const body = await response.json();
    console.log(response.statusText());
    console.log(body);

    expect(response.status()).toBe(200);

    const connectors = Array.isArray(body) ? body : body.data;
    expect(Array.isArray(connectors)).toBeTruthy();
    expect(connectors.length).toBeGreaterThan(0);

    for (const connector of connectors) {
      expect(connector, `isActive missing on connector ${connector?.id}`).toHaveProperty('isActive');
      expect(
        typeof connector.isActive,
        `isActive must be true or false on connector ${connector?.id}`
      ).toBe('boolean');
      expect([true, false]).toContain(connector.isActive);
    }
  });

  test('KB connectors API users can limit the number of connectors returned in a single response.', qality('OI-12857', [REGRESSION,SANITY]), async ({ api }) => {
    const limit = data.connectorListLimit;
    const response = await api.get(`${Endpoints().listConnectors}?limit=${limit}`);
    const body = await response.json();
    console.log(response.statusText());
    console.log(body);

    expect(response.status()).toBe(200);

    const connectors = Array.isArray(body) ? body : body.data;
    expect(Array.isArray(connectors)).toBeTruthy();
    expect(connectors.length).toBe(limit);
  });

  test('KB connector API users can search the connector using the connector name.',qality('OI-12859',  [SANITY,REGRESSION]), async ({ api }) => {
    const searchName = data.connectorSearchName;
    const response = await api.get(`${Endpoints().listConnectors}?q=${encodeURIComponent(searchName)}`);
    const body = await response.json();
    console.log(response.statusText());
    console.log(body);

    expect(response.status()).toBe(200);

    const connectors = Array.isArray(body) ? body : body.data;
    expect(Array.isArray(connectors)).toBeTruthy();
    expect(connectors.length).toBeGreaterThan(0);

    for (const connector of connectors) {
      expect(
        connector.name.toLowerCase(),
        `Connector "${connector.name}" does not match search "${searchName}"`
      ).toContain(searchName.toLowerCase());
    }
  });

  test('KB connector API users can search the KB validation connector list using a partial connector name', qality('OI-12863',[REGRESSION] ), async ({ api }) => {
    const partialName = data.connectorPartialSearchName;
    const response = await api.get(`${Endpoints().listConnectors}?q=${encodeURIComponent(partialName)}`);
    const body = await response.json();
    console.log(response.statusText());
    console.log(body);

    expect(response.status()).toBe(200);

    const connectors = Array.isArray(body) ? body : body.data;
    expect(Array.isArray(connectors)).toBeTruthy();
    expect(connectors.length).toBeGreaterThan(0);

    for (const connector of connectors) {
      expect(
        connector.name.toLowerCase().startsWith(partialName.toLowerCase()),
        `Connector "${connector.name}" does not start with "${partialName}"`
      ).toBeTruthy();
    }
  });

  test('KB connector API returns all connectors when the search value is empty', qality('OI-12864',[REGRESSION] ), async ({ api }) => {
    const emptySearch = data.connectorEmptySearchName;

    const unfilteredResponse = await api.get(Endpoints().listConnectors);
    const unfilteredBody = await unfilteredResponse.json();
    const allConnectors = Array.isArray(unfilteredBody) ? unfilteredBody : unfilteredBody.data;

    const response = await api.get(`${Endpoints().listConnectors}?q=${encodeURIComponent(emptySearch)}`);
    const body = await response.json();
    console.log(response.statusText());
    console.log(body);

    expect(response.status()).toBe(200);

    const connectors = Array.isArray(body) ? body : body.data;
    expect(Array.isArray(connectors)).toBeTruthy();
    expect(connectors.length).toBeGreaterThan(0);
    expect(connectors.map((connector: { id: string }) => connector.id)).toEqual(
      allConnectors.map((connector: { id: string }) => connector.id)
    );
  });

  test('KB connector API each connector response includes valid Web and Logo information',qality('OI-12867',[REGRESSION] ), async ({ api }) => {
    const response = await api.get(Endpoints().listConnectors);
    const body = await response.json();
    console.log(response.statusText());
    console.log(body);

    expect(response.status()).toBe(200);

    const connectors = Array.isArray(body) ? body : body.data;
    expect(Array.isArray(connectors)).toBeTruthy();
    expect(connectors.length).toBeGreaterThan(0);

    for (const connector of connectors) {
      expect(connector.webUrl, `Invalid webUrl on ${connector.name}`).toMatch(/^https?:\/\/.+/);
      expect(connector.logoUrl, `Invalid logoUrl on ${connector.name}`).toMatch(/^https?:\/\/.+/);
    }
  });

  test('KB connector API returns 20 connectors by default when limit is not provided', qality('OI-13200',[SANITY,REGRESSION] ), async ({ api }) => {
    const response = await api.get(Endpoints().listConnectors);
    const body = await response.json();
    console.log(response.statusText());
    console.log(body);

    expect(response.status()).toBe(200);

    const connectors = Array.isArray(body) ? body : body.data;
    expect(Array.isArray(connectors)).toBeTruthy();
    expect(connectors.length).toBeLessThanOrEqual(data.connectorListPageSize);
    expect(connectors.length).toBe(data.connectorListPageSize);
  });

  test('KB connector API connectors can be filtered by exact name equals', qality('OI-13201',[SANITY,REGRESSION] ), async ({ api }) => {
    const name = data.connectorNameEquals;
    const response = await api.get(Endpoints().connectorByNameEquals(name));
    const body = await response.json();
    console.log(response.statusText());
    console.log(body);

    expect(response.status()).toBe(200);

    const connectors = Array.isArray(body) ? body : body.data;
    expect(Array.isArray(connectors)).toBeTruthy();
    expect(connectors.length).toBeGreaterThan(0);

    for (const connector of connectors) {
      expect(connector.name.toLowerCase()).toBe(name.toLowerCase());
    }
  });

  test('KB connector API connectors can be filtered by name starting with specific text', qality('OI-13202',[SANITY,REGRESSION] ), async ({ api }) => {
    const name = data.connectorNameStartsWith;
    const response = await api.get(Endpoints().connectorByNameStartsWith(name));
    const body = await response.json();
    console.log(response.statusText());
    console.log(body);

    expect(response.status()).toBe(200);

    const connectors = Array.isArray(body) ? body : body.data;
    expect(Array.isArray(connectors)).toBeTruthy();
    expect(connectors.length).toBeGreaterThan(0);

    for (const connector of connectors) {
      expect(connector.name.toLowerCase().startsWith(name.toLowerCase())).toBeTruthy();
    }
  });

  test('KB connector API connectors can be filtered by name containing specific text',qality('OI-13203',[SANITY,REGRESSION] ), async ({ api }) => {
    const name = data.connectorNameContains;
    const response = await api.get(Endpoints().connectorByNameContains(name));
    const body = await response.json();
    console.log(response.statusText());
    console.log(body);

    expect(response.status()).toBe(200);

    const connectors = Array.isArray(body) ? body : body.data;
    expect(Array.isArray(connectors)).toBeTruthy();
    expect(connectors.length).toBeGreaterThan(0);

    for (const connector of connectors) {
      expect(connector.name.toLowerCase()).toContain(name.toLowerCase());
    }
  });

});
