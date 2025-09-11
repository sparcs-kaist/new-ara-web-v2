// next.config.js
const base = require('./next.config.base');
const dev = require('./next.config.dev');
const prod = require('./next.config.prod');

const merge = (a, b) => ({
  ...a,
  ...b,
  images: { ...(a.images || {}), ...(b.images || {}) },
});

module.exports = () => {
  const isDev = process.env.NEXT_PUBLIC_APP_ENV === 'development'; //dev server + local
  const isProd = process.env.NEXT_PUBLIC_APP_ENV === 'production';
  return isDev ? merge(base, dev) : merge(base, prod);
};