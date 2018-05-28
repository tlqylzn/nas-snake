// https://github.com/michael-ciniawsky/postcss-load-config

module.exports = {
  "plugins": {
    "postcss-import": {},
    "postcss-url": {},
    "autoprefixer": {},
    "postcss-flexible": require('postcss-flexible')({
      remUnit: 75
    })
  }
}
