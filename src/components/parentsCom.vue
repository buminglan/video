<template>
    <div class="container">
      <input type="up" />
      <input class="file-li-file" type="file" accept="video/*" @change="uploadVideo" />
      <!-- <video :src="videoUrl2" v-if="videoUrl2" controls style="width:400px;object-fit:contain"></video> -->
      <cut-video
        v-if="cut.show"
        :url="ff.videoUrl"
        :startTime="cut.startTime"
        :endTime="cut.endTime"
        :spliterEndTime="cut.spliterEndTime"
        :ffVideo="ff"
        @sure="onSureCut"
        @cancel="cut.show=false"
        @frame="onVideoFrame"
      />
      原视频
      <video 
        :src="ff.videoUrl"
        v-if="ff.videoUrl"
        controls
        style="width:400px;object-fit:contain;border:2px solid #fff">
        
        <track src="./example.vtt" kind="subtitles" label="中文字幕" srclang="zh" default>

      </video>
      <!-- <video
        :src="ff.videoUrl"
        v-if="ff.videoUrl"
        controls
        style="width:400px;object-fit:contain;border:2px solid #fff"
      /> -->
      减后视频
      <video
        :src="ff.newVideoUrl"
        v-if="ff.newVideoUrl"
        controls
        style="width:400px;object-fit:contain;border:2px solid #00f"
      />
    </div>
  </template>
  <script>
//   import cutVideo from "./cut/cutVideo";
import cutVideo from "./cut/cutVideo.vue";
  import checkSize from "@/utils/upload";
  import FFmpeg from "@ffmpeg/ffmpeg";
  const { createFFmpeg, fetchFile } = FFmpeg;
  const ffmpeg = createFFmpeg({ log: false });
  console.log("ffmpeg", ffmpeg, ffmpeg.isLoaded());
  if (!ffmpeg.isLoaded()) {
    ffmpeg.load().catch(err => {
      console.log(err);
    });
  }
  export default {
    components: { cutVideo },
    name:'parentsCom',
    data() {
      return {
        // videoUrl2: "",
        // videoName: "",
        // orgFileBuffer: "",
        // TEM_FILE_NAME: "newVideo.mp4",
        ff: {
          name: "",
          file: null,
          newName: "newVideo.mp4",
          videoUrl: "",
          newVideoUrl: "",
          blob: null,
          frames: [],
          duration: 0
        },
        cut: {
          spliterEndTime: "00:10:10.0",
          imgs: new Array(20),
          startTime: "00:00:00.0",
          endTime: "00:10:10.0",
          show: false,
          duration: 0
        }
      };
    },
    methods: {
      async uploadVideo(e) {
        let file = e.target.files[0],
          { name } = file,
          orgFileBuffer = await file.arrayBuffer(); // 获取文件数据
        ffmpeg.FS("writeFile", name, await fetchFile(new Blob([orgFileBuffer]))); // 将视频数据写入内存
        let videoUrl = URL.createObjectURL(new Blob([orgFileBuffer])); // 将视频数据转为url
        let { duration } = await checkSize(e.target.files);
        console.log("uploadVideo", file, duration);
  
        Object.assign(this.ff, {
          videoUrl,
          name,
          file,
          duration,
          frames: []
        });
        this.$nextTick(() => {
          this.cut.show = true;
        });
        return { name, videoUrl };
      },
      async onSureCut(e) {
        let startTime = this.time_to_sec(e[0]),
          endTime = this.time_to_sec(e[1]);
        try {
          // showLoading();
          let { name, newName } = this.ff;
          await ffmpeg.run(
            "-ss",
            `${startTime}`,
            "-t",
            `${endTime - startTime}`,
            "-i",
            name,
            "-vcodec",
            "copy",
            "-acodec",
            "copy",
            newName
          );
          let arrayBuffer = ffmpeg.FS("readFile", newName).buffer; // 读取缓存
          let blob = new Blob([arrayBuffer]);
          this.ff.newVideoUrl = URL.createObjectURL(blob); // 转为Blob URL
          this.ff.blob = blob; //上传文件用
          // this.cut.show = false;
          // hideLoading();
        } catch (err) {
          // console.log("切视频err", err);
          throw err;
        }
      },
      onVideoFrame(e) {
        this.ff.frames = e;
      },
      time_to_sec(time) {
        let hour = time.split(":")[0],
          min = time.split(":")[1],
          sec = time.split(":")[2],
          s = Number(hour * 3600) + Number(min * 60) + Number(sec);
        return s;
      }
    }
  };
  </script>
  <style >
  body {
    background: #000;
  }
  * {
    color: #fff;
    font-size: 12px;
  }
  </style>
  