// 获取最大公约数
function getGcd(a, b) {
    let n1, n2;
    if (a > b) {
        n1 = a;
        n2 = b;
    } else {
        n1 = b;
        n2 = a;
    }
    let remainder = n1 % n2;
    if (remainder === 0) {
        return n2;
    } else {
        return getGcd(n2, remainder)
    }
}
// 创建虚拟dom 并且放回对应的值
let checkSize = async (files, isVideo) => {
    if (!files || !files[0]) return false
    const checktimevideo = document.getElementById('checktimevideo')
    if (checktimevideo) {
        document.body.removeChild(checktimevideo)
    }
    let doms
    if (!isVideo) {
        doms = document.createElement('video')
    } else {
        doms = document.createElement('audio')
    }
    const url = URL.createObjectURL(files[0])
    console.log(url)
    doms.src = url
    doms.id = 'checktimevideo'
    doms.style.display = 'none'
    document.body.appendChild(doms)
    return await gettime(doms);
}
let gettime = (doms) => {
    // 由于loadedmetadata 是异步代码所以需要promise进行封装转换为同步代码执行
    const promise = new Promise(resolve => {
        doms.addEventListener('loadedmetadata', e => {
            const gcd = getGcd(e.target.videoWidth, e.target.videoHeight);
            // console.log(gcd)
            let obj = {
                width: doms.videoWidth, // 尺寸宽 --- 分辨率
                height: doms.videoHeight, // 尺寸高
                duration: Number(e.target.duration.toFixed(2)), // 视频时长 1表示一秒
                ccbl: [e.target.videoWidth / gcd, e.target.videoHeight / gcd] // 计算尺寸比例
            }
            resolve(obj)
        })
    })
    return promise
}
export default checkSize
