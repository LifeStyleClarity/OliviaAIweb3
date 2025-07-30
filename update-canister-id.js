import fs from 'fs';

const canisterIds = JSON.parse(fs.readFileSync('./icp_backend/.dfx/local/canister_ids.json', 'utf8'));
const backendCanisterId = canisterIds.icp_backend_backend?.local;

const servicePath = './src/api/services/icp.service.js';
let content = fs.readFileSync(servicePath, 'utf8');

content = content.replace(/const CANISTER_ID = '[^']+';/, `const CANISTER_ID = '${backendCanisterId}';`);
fs.writeFileSync(servicePath, content);

console.log(`Updated: ${backendCanisterId}`); 