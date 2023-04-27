<template>
    <!-- <div>
      <div class="file">
        <input type="file" @change="change()">
        <video v-if="videoSrc" controls>
          <source :src="videoSrc" type="video/mp4">
        </video>
      </div>
    </div> -->
    <div class="demo">
            <video id="video" width="320" height="600" autoplay autobuffer controls>
              <source src="./aaa.mp4">
              <track src="./sss.vtt" kind="subtitles" label="中文字幕" srclang="zh" default>
              <!-- <track src="./sing-song_fix.vtt" kind="subtitles" label="中文字幕（修正）" srclang="zh"> -->
            </video>
          </div>
</template>
  
<script>
  export default {
    name: "FirstVedo",
    
    
  }
  </script>
  
  <style scoped>
        
        
  </style>