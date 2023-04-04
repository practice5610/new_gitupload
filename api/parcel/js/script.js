import { version } from '../../package.json';
import { h, Component, render } from 'preact';
import htm from 'htm';

// Initialize htm with Preact
const html = htm.bind(h);

function VersionHTML(props) {
  return html`Version ${props.name}`;
}
function openApiSpecHTML(props) {
  return html`OpenAPI spec: <a href="/api/v1/explorer/openapi.json">/openapi.json</a>`;
}
function apiExplorerHTML(props) {
  return html`API Explorer: <a href="/api/v1/explorer">/explorer</a>`;
}
render(html`<${VersionHTML} name=${version} />`, document.getElementById('version'));
render(html`<${openApiSpecHTML} />`, document.getElementById('openApiSpec'));
render(html`<${apiExplorerHTML} />`, document.getElementById('apiExplorer'));
