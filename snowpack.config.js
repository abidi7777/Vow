module.exports = {
  mount: {
    src: '/',
  },
  buildOptions: {
    out: 'dist',
  },
  optimize: {
    entrypoints: ['./src/Vow.js'],
    bundle: true,
    minify: true,
    target: 'es6',
    treeshake: true,
    sourcemap: false,
  },
};
