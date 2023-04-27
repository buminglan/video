<template>
    <div class="cut-video">
      <video
        id="videoPlayer"
        @play="onplay"
        controls="true"
        preload="auto"
        muted
        class="video"
        width="100%"
        :src="url"
      ></video>
      <!-- autoplay -->
      <!-- crossorigin="anonymous" -->
      <ul class="time-list">
        <li v-for="(i,n) in data.timeList" :key="n">{{i}}</li>
      </ul>
      <div class="crop-filter">
        <div class="timer-shaft" ref="shaft">
          <div
            class="white-shade"
            :style="{width:(data.endLeft-data.startLeft+12)+'px',left:data.startLeft-6+'px'}"
          ></div>
          <div class="left-shade" :style="{width: (data.startLeft)+'px'}"></div>
          <div class="right-shade" :style="{width:(shaftWidth-data.endLeft)+'px'}" ref="rightShade"></div>
          <div class="strat-circle circle" ref="start" @mousedown="startMouseDown">
            <div class="center"></div>
          </div>
          <div class="end-circle circle" ref="end" @mousedown="endMouseDown">
            <div class="center"></div>
          </div>
          <!-- 此处src应绑定item -->
          <img
            class="frames"
            @dragstart.prevent
            :style="{width:`calc(100% / ${videoFrames.length})`}"
            v-for="(i,n) in videoFrames"
            :key="n"
            :src="`data:image/jpg;base64,${i}`"
            alt
          />
          <!-- src="@/public/favicon.ico" -->
        </div>
      </div>
      <div class="flex">
        <button @click="onCancel" type="info" size="mini">Cancel</button>
        <button @click="onSureCut" type="primary" size="mini">Next</button>
      </div>
    </div>
  </template>
  <!-- 起止时间间隔最小≈1秒 -->
  <script>
  import { getNowTime, dateStrChangeTimeTamp } from "@/utils/cutVideo";
  import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
  import arrayBufferToBase64 from "@/utils/arrayBufferToBase64";
  const ffmpeg = createFFmpeg({ log: false });
  if (!ffmpeg.isLoaded()) {
    ffmpeg.load().catch(err => {
      console.log("ffmpeg--err", err);
    });
  }
  export default {
    name: "cutVideo",
    data() {
      return {
        shaftWidth: 0,
        shaft: null, //进度条dom
        start: null, // 开始按钮dom
        end: null, //結束按鈕dom
        data: {
          endLeft: 0, // 结束按钮距离左侧距离
          endright: 0, // 结束按钮初始位置
          startLeft: 0, // 开始按钮距离左侧距离
          roal: 0, // 毫秒/px(1px===的毫秒数)
          startTime: "00:00:00.0", // 开始时间
          endTime: "00:00:00.0", // 结束时间
          timeList: [] // 时间轴显示时间数组
        },
        videoFrames: []
      };
    },
    props: {
      startTime: { type: String, default: "00:00:00.0" },
      endTime: { type: String, default: "00:00:10.0" },
      spliterStartTime: { type: String, default: "" },
      spliterEndTime: { type: String, default: "" },
      url: { type: String, default: "" },
      ffVideo: {
        type: Object,
        default: () => {
          return {
            name: "",
            file: null,
            blob: null,
            duration: ""
          };
        }
      }
      // videoFrames: { type: Array, default: () => [] }
    },
    mounted() {
      // 随便拼一个1970年以后的年月日字符串+' '
      let str = "1970-01-02 ";
      let time =
        dateStrChangeTimeTamp(str + this.endTime) -
        dateStrChangeTimeTamp(str + this.startTime);
      this.data.roal = time / this.$refs.shaft.clientWidth;
      this.shaftWidth = this.$refs.shaft.clientWidth;
      // 结束毫秒数
      let endM =
        dateStrChangeTimeTamp("1970-01-02 " + this.spliterEndTime) -
        1000 * 60 * 60 * 16;
      // 开始毫秒数
      let startM =
        dateStrChangeTimeTamp("1970-01-02 " + this.spliterStartTime) -
        1000 * 60 * 60 * 16;
      // console.log(startM, endM);
      // 设置开始结束位置
      this.$refs.start.style.left =
        startM / this.data.roal - this.$refs.end.clientWidth / 2 + "px";
      this.$refs.end.style.left =
        endM / this.data.roal - this.$refs.end.clientWidth / 2 + "px";
  
      this.data.endLeft = this.$refs.end.offsetLeft;
      this.data.endright =
        this.$refs.shaft.clientWidth - this.$refs.end.clientWidth / 2;
      this.data.startLeft =
        this.$refs.start.offsetLeft + this.$refs.start.clientWidth / 2;
      this.getVideoTime();
      this.data.timeList.push(this.startTime);
      let paragraph =
        (dateStrChangeTimeTamp(str + this.endTime) - 1000 * 60 * 60 * 16) / 5;
      for (let i = 1; i < 6; i++) {
        this.data.timeList.push(getNowTime(paragraph * i));
        console.log('paragraph',this.data.timeList)
      }
      Object.assign(this.data, {
        endTime: this.endTime,
        startTime: this.startTime
      });
      if (this.ffVideo.frames.length) {
        this.videoFrames = this.ffVideo.frames;
      } else {
        this.getVideoFrames();
      }
    },
    methods: {
      onplay() {
        let myVideo = document.getElementById("videoPlayer"),
          { startTime, endTime } = this.data;
        // 开始秒数
        let startM =
          (dateStrChangeTimeTamp(
            "1970-01-02 " +
              (this.data.startTime ? this.data.startTime : this.spliterStartTime)
          ) -
            1000 * 60 * 60 * 16) /
          1000;
        // 结束秒数
        let endM =
          (dateStrChangeTimeTamp(
            "1970-01-02 " +
              (this.data.endTime ? this.data.endTime : this.spliterEndTime)
          ) -
            1000 * 60 * 60 * 16) /
          1000;
        // 如果当前秒数小于等于截取的开始时间,就按截取的开始时间播放,如果不是,则为继续播放
        if (myVideo.currentTime <= startM || myVideo.currentTime > endM) {
          myVideo.currentTime = startM;
          myVideo.play();
        }
      },
      // 获取视频播放时长
      getVideoTime() {
        let videoPlayer = document.getElementById("videoPlayer");
        if (videoPlayer) {
          videoPlayer.addEventListener(
            "timeupdate",
            () => {
              // 结束秒数
              let endM =
                (dateStrChangeTimeTamp(
                  "1970-01-02 " +
                    (this.data.endTime ? this.data.endTime : this.spliterEndTime)
                ) -
                  1000 * 60 * 60 * 16) /
                1000;
              // 如果当前播放时间大于等于截取的结束秒数,就暂停
              if (videoPlayer.currentTime >= endM) {
                videoPlayer.pause();
              }
            },
            false
          );
        }
      },
      //设置播放点
      playBySeconds(num) {
        if (num && document.getElementById("videoPlayer")) {
          let myVideo = document.getElementById("videoPlayer");
          myVideo.currentTime = num;
        }
      },
      // 起始按钮
      startMouseDown(e) {
        let odiv = e.currentTarget; //获取目标父元素
        //算出鼠标相对元素的位置
        let disX = e.clientX - odiv.offsetLeft;
        document.onmousemove = e => {
          let { clientWidth, offsetLeft } = this.$refs.start;
          //鼠标按下并移动的事件
          //用鼠标的位置减去鼠标相对元素的位置，得到元素的位置
          let left = e.clientX - disX;
  
          //移动当前元素
          odiv.style.left = left + "px";
          //获取距离窗口宽度
          let mas = odiv.offsetLeft;
          if (mas <= -(clientWidth / 2)) {
            odiv.style.left = -(clientWidth / 2) + "px";
          } else if (
            mas >=
            this.data.endLeft - Math.ceil(1000 / this.data.roal)
          ) {
            odiv.style.left =
              this.data.endLeft - Math.ceil(1000 / this.data.roal) + "px";
          }
          this.data.startTime = getNowTime(
            this.data.roal * Math.floor(offsetLeft + clientWidth / 2)
          );
          this.data.startLeft = clientWidth + offsetLeft;
          // 开始秒数
          let startM =
            (dateStrChangeTimeTamp(
              "1970-01-02 " +
                (this.data.startTime
                  ? this.data.startTime
                  : this.spliterStartTime)
            ) -
              1000 * 60 * 60 * 16) /
            1000;
          this.playBySeconds(startM);
        };
        document.onmouseup = e => {
          document.onmousemove = null;
          document.onmouseup = null;
          this.handleTime();
        };
      },
      // 结束按钮
      endMouseDown(e) {
        let odiv = e.currentTarget; //获取目标父元素
        //算出鼠标相对元素的位置
        let disX = e.clientX - odiv.offsetLeft;
        document.onmousemove = e => {
          //鼠标按下并移动的事件
          let { clientWidth, offsetLeft } = this.$refs.end;
          //用鼠标的位置减去鼠标相对元素的位置，得到元素的位置
          let left = e.clientX - disX;
          //移动当前元素
          odiv.style.left = left + "px";
          //获取距离窗口宽度
          let mas = odiv.offsetLeft;
  
          if (
            mas <=
            this.data.startLeft - clientWidth + Math.ceil(1000 / this.data.roal)
          ) {
            odiv.style.left =
              this.data.startLeft -
              clientWidth +
              Math.ceil(1000 / this.data.roal) +
              "px";
            // console.log(22222)
          } else if (mas >= this.data.endright) {
            odiv.style.left = this.data.endright + "px";
            // console.log(33333)
          }
          this.data.endTime = getNowTime(
            this.data.roal * Math.floor(offsetLeft + clientWidth / 2)
          );
          this.data.endLeft = offsetLeft;
        };
        document.onmouseup = e => {
          document.onmousemove = null;
          document.onmouseup = null;
          this.handleTime();
        };
      },
      // 传出起止时间的回调
      handleTime() {
        let arr = [this.data.startTime, this.data.endTime];
        this.$emit("queryTime", arr);
      },
      onSureCut() {
        this.$emit("sure", [this.data.startTime, this.data.endTime]);
      },
      onCancel() {
        this.$emit("cancel");
      },
      // 上传视频后解析视频帧
      async getVideoFrames() {
        try {
          let { name, file, duration } = this.ffVideo;
          ffmpeg.FS("writeFile", name, await fetchFile(file));
          // 计算每秒需要抽的帧数
          let step = Math.ceil(20 / duration),
            allNum = Math.floor(step * duration);
          console.log("step", step, allNum);
          await ffmpeg.run(
            "-i",
            name,
            "-r",
            `${step}`,
            "-ss",
            "0",
            "-vframes",
            `${allNum}`,
            "-f",
            "image2",
            "-s",
            "88*50",
            "image-%02d.png"
          );
          // ffmpeg -i 2.mp4 -r 1  -ss 0 -vframes 5 -f image2 -s 352x240 image-%02d.jpeg
          for (let i = 0; i < allNum; i++) {
            // await ffmpeg.run('-i', 'source.mp4', '-y', '-f', '-ss', averageDura * i, '1', 'frame.png')
            let temp = i + 1;
            if (temp < 10) {
              temp = "0" + temp;
            }
            this.videoFrames.push(
              arrayBufferToBase64(ffmpeg.FS("readFile", "image-" + temp + ".png"))
            );
          }
          this.$emit("frame", this.videoFrames);
        } catch (err) {}
      },
     
    }
  };
  </script>
   
  <style scoped lang="scss">
  .cut-video {
    .video {
      height: calc(100vh - 250px);
      object-fit: contain;
      margin-bottom: 0.2rem;
    }
  
    .time-list {
      width: 100%;
      color: #c0c0c0;
      font-size: 0.12rem;
      margin-bottom: 0.1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      // display: none;
      margin-bottom: 10px;
    }
  
    .crop-filter {
      height: 60px;
      width: 100%;
      padding: 0 0.1rem;
      box-sizing: border-box;
      display: flex;
      align-items: center;
  
      .timer-shaft {
        width: 100%;
        height: 100%;
        position: relative;
  
        .circle {
          width: 0.2rem;
          position: absolute;
          top: -5%;
          height: 110%;
          background-color: #ffffff;
          cursor: e-resize;
          display: flex;
          align-items: center;
          justify-content: center;
  
          .center {
            width: 0.02rem;
            height: 0.15rem;
            background-color: #d8d8d8;
          }
        }
  
        .strat-circle {
          left: -0.09rem;
          border-radius: 0.03rem 0 0 0.03rem;
        }
  
        .end-circle {
          right: -0.1rem;
          border-radius: 0 0.03rem 0.03rem 0;
        }
  
        .white-shade {
          position: absolute;
          top: -8%;
          height: 110%;
          width: 100%;
          background-color: transparent;
          border: 0.04rem solid #fff;
          box-sizing: border-box;
          border-left: 0;
          border-right: 0;
        }
  
        .left-shade {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          background: rgba(0, 0, 0, 0.6);
        }
  
        .right-shade {
          position: absolute;
          right: 0;
          top: 0;
          height: 100%;
          background: rgba(0, 0, 0, 0.6);
        }
      }
    }
    > .flex {
      justify-content: flex-end;
      margin-top: 20px;
    }
    .frames {
      user-select: none;
      height: 100%;
      object-fit: cover;
      // &:hover {
      //   object-fit: contain;
      //   width: 100px !important;
      //   position: absolute;
      //   top: -60px;
      //   // height: 100% !important;
      // }
    }
    button {
      // background: hsl(0, 0%, 85%);
      color: #000;
    }
  }
  </style>
  