import Vue from 'vue';
import App from '/App.vue';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
const ffmpeg = createFFmpeg();
if (!ffmpeg.isLoaded()) {
  ffmpeg.load().catch((err) => {
    console.log(err);
  })
};


new Vue({
  render: h => h(App)
}).$mount('#app')
