<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'App',
  metaInfo: {
    title: 'NAS贪吃蛇🐍',
    meta: [
      {
        'charset': 'utf-8'
      },
      {
        'name': 'viewport',
        'content': 'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no'
      },
      {
        'name': 'renderer',
        'content': 'webkit|ie-stand|ie-comp'
      },
      {
        'name': 'apple-mobile-web-app-capable',
        'content': 'yes'
      },
      {
        'name': 'apple-mobile-web-app-status-bar-style',
        'content': 'black'
      },
      {
        'name': 'format-detection',
        'content': 'telephone=no,email=no'
      },
      {
        'name': 'msapplication-tap-highlight',
        'content': 'no'
      },
      {
        'name': 'flexible',
        'content': 'initial-dpr=2,maximum-dpr=3'
      },
      {
        'name': 'screen-orientation',
        'content': 'portrait'
      },
      {
        'name': 'x5-orientation',
        'content': 'portrait'
      },
      {
        'name': 'full-screen',
        'content': 'yes'
      },
      {
        'name': 'x5-fullscreen',
        'content': 'true'
      },
      {
        'name': 'browsermode',
        'content': 'application'
      },
      {
        'name': 'x5-page-mode',
        'content': 'app'
      }
    ]
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
html, body, #app {
  width: 100%;
  height: 100%;
  min-height: 100%;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
