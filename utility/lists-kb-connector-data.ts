export function Endpoints() {
  return {
    listConnectors: '/api/v1/connectors',
    listConnectorsByType: '/api/v1/connectors?connectorType=CUSTOM',
    connectorByNameEquals: (name: string) => `/api/v1/connectors?filter[name][eq]=${encodeURIComponent(name)}`,
    connectorByNameStartsWith: (name: string) => `/api/v1/connectors?filter[name][startsWith]=${encodeURIComponent(name)}`,
    connectorByNameContains: (name: string) => `/api/v1/connectors?filter[name][contains]=${encodeURIComponent(name)}`,
  };
}

export function ConnectorSql() {
  return {
    listConnectorsWithoutFilters: 'SELECT c.* FROM public."Connector" AS c',
  };
}

export function ConnectorTestData() {
  return {
    connectorListLimit: 5,
    connectorSearchName: 'Microsoft SharePoint',
    connectorPartialSearchName: 'Microsoft',
    connectorEmptySearchName: '',
    connectorNameEquals: 'elevenlabs',
    connectorNameStartsWith: 'eleven',
    connectorNameContains: 'jira',
    connectorListPageSize: 20,
    requiredConnectorFields: [
      'id',
      'name',
      'integrationType',
      'isActive',
      'connectionId',
      'syncStatus',
      'connectorType',
      'scope',
      'webUrl',
      'logoUrl',
    ],
    uuidRegex: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    requiredPaginationFields: ['page', 'limit', 'total'],
  };
}
