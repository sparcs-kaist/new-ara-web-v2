// next.config.js
const {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
} = require('next/constants');

const base = require('./next.config.base');
const dev = require('./next.config.dev');
const prod = require('./next.config.prod');

const merge = (a, b) => ({
  ...a,
  ...b,
  images: { ...(a.images || {}), ...(b.images || {}) },
});

module.exports = (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  const isProd = phase === PHASE_PRODUCTION_BUILD || phase === PHASE_PRODUCTION_SERVER;
  return isDev ? merge(base, dev) : merge(base, prod);
};