const serverless = require('serverless-http');
const expressApp = require('../../backend/dist/index');

const app = expressApp.default || expressApp.app || expressApp;

module.exports.handler = serverless(app);
