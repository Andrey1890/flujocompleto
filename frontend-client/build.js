const fs = require('node:fs');
const path = require('node:path');

const sourceDirectory = __dirname;
const outputDirectory = path.join(sourceDirectory, 'dist');
const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:5051';
const parsedApiUrl = new URL(apiBaseUrl.includes('://') ? apiBaseUrl : `https://${apiBaseUrl}`);

if (!['http:', 'https:'].includes(parsedApiUrl.protocol)) {
  throw new Error('API_BASE_URL must use HTTP or HTTPS');
}

fs.mkdirSync(outputDirectory, { recursive: true });

for (const fileName of ['index.html', 'styles.css', 'app.js']) {
  fs.copyFileSync(path.join(sourceDirectory, fileName), path.join(outputDirectory, fileName));
}

const apiUrl = new URL('/api/v1/productos', parsedApiUrl.origin).toString();
fs.writeFileSync(
  path.join(outputDirectory, 'config.js'),
  `window.API_URL = ${JSON.stringify(apiUrl)};\n`,
  'utf8'
);
