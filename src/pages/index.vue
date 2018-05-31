<template>
  <div class="wrap" ref="wrap">
    <div class="start-btn" v-if="showStartBtn">
      <el-button type="success" @click="start">开始</el-button>
    </div>
    <div class="ranking">
      <el-button type="info" icon="el-icon-sort" round size="small" @click="showRanking">排行榜</el-button>
    </div>
    <div class="logo-box">
      <img class="logo" src="../assets/images/logo-b.png">
      星云贪吃蛇
    </div>
    <div class="copyright">
      注意：请安装 <a href="https://github.com/ChengOrangeJu/WebExtensionWallet" target="_blank">WebExtensionWallet</a> 官方钱包插件后游玩 星云贪吃蛇
    </div>

    <!--查看详细弹框-->
    <el-dialog title="星云贪吃蛇排行榜" :visible.sync="dialogRankingInfoVisible" width="50%" :modal="false">
      <el-table :data="rankingList">
        <el-table-column type="index" label="排名" width="60">
        </el-table-column>
        <el-table-column property="nickname" label="玩家昵称" width="150"></el-table-column>
        <el-table-column property="address" label="玩家地址"></el-table-column>
        <el-table-column property="score" label="分数" width="80"></el-table-column>
      </el-table>
    </el-dialog>

    <div class="main">
      <div
        class="map"
        :style="{
          'paddingTop': remainTB + 'px',
          'paddingBottom': remainTB + 'px',
          'paddingLeft': remainLR + 'px',
          'paddingRight': remainLR + 'px'
        }">
        <div
          class="map-row"
          v-for="row in mapLists"
          :key="row.key">
          <div
            class="map-col"
            v-for="col in row.colList"
            :key="col.key">
            <div
              class="snake-part"
              :class="[{
                'header': snake.indexOf(col.key) === 0,
                'body':
                  snake.indexOf(col.key) > -1 &&
                  snake.indexOf(col.key) !== 0 &&
                  snake.indexOf(col.key) !== snake.length - 1,
                'footer':
                  snake.indexOf(col.key) === snake.length - 1,
                'egg': col.isEgg
              }, dirClassName]"></div>
          </div>
        </div>
      </div>
    </div>



    <transition name="fade">
      <div class="pop-ups" v-show="showCountdown">
        <h1 class="countdown-wrap__text">{{ countdown }}</h1>
      </div>
    </transition>

    <transition name="fade">
      <div class="pop-ups" v-show="isShowPop">
        <div class="pop-ups__content">
          <p class="title">
            游戏结束
          </p>
          <p class="desc">本次得分为：{{ getScoreCount }}</p>
          <button type="button" class="reStart" @click="reStart">
            重新开始
          </button>
          <button type="button" class="toRanking" @click="toRanking">
            排行榜PK (上链)
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import Hammer from 'hammerjs'
import Nebulas from 'nebulas'
import NebPay from 'nebpay.js'
import _ from 'lodash'

var Neb = Nebulas.Neb
// var neb = new Neb(new Nebulas.HttpRequest('https://testnet.nebulas.io'))
var neb = new Neb(new Nebulas.HttpRequest('https://mainnet.nebulas.io'))
var api = neb.api

// 合约地址 test
// const dappAddress = 'n1vCrksQ4HHNUK2PBboHDYkDhuwVNwPVjzx'

// 合约地址 main
const dappAddress = 'n1sbRguE7eZHLfXCCC1RjNMtfv3fjn1DbSy'

export default {
  data () {
    return {
      isShowPop: false,
      showCountdown: false,
      countdown: 3,
      // 剩余上下
      remainTB: 0,
      // 剩余左右
      remainLR: 0,
      // 行数量
      rowNumber: 0,
      // 列数量
      columnNumber: 0,
      mapLists: [],
      // 位置坐标
      x: 0,
      y: 0,
      // 吃蛋数量
      scoreCount: 0,
      // 蛋位置
      eggX: 0,
      eggY: 0,
      // 方向
      direction: 'up',
      // 避免同时多次改变方向句柄
      changeDir: true,
      // 运动时间句柄
      moveTimer: null,
      snake: [],
      // 蛇的长度
      snakeLen: 4,
      // 速度
      speed: 200,


      showStartBtn: 1,
      dialogRankingInfoVisible: false,
      rankingList: [],  // 排行榜数据
      nickName: '', // 玩家昵称
      userAddress: localStorage.getItem('userAddress') ? localStorage.getItem('userAddress') : 'n1cz1GweGxt4r5FBRSQuvNCg3WrzGycKPLd', // 玩家地址
      blockchainScore: 0,
      currUserScore: {}
    }
  },
  computed: {
    getScoreCount () {
      return this.scoreCount * 10
    },
    dirClassName () {
      switch (this.direction) {
        case 'up':
          return ''
        case 'down':
          return 'rotate180'
        case 'left':
          return 'rotate270'
        case 'right':
          return 'rotate90'
      }
    }
  },
  methods: {
    // 设置地图信息
    setMapData () {
      for (let i = 0; i < this.rowNumber; i++) {
        let obj = {
          key: i,
          colList: []
        }
        for (let k = 0; k < this.columnNumber; k++) {
          let c = {
            key: `${i}-${k}`,
            isEgg: false
          }
          this.$set(obj.colList, k, c)
        }
        this.$set(this.mapLists, i, obj)
      }
    },
    // 随机数
    random (min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min)
    },
    // 生成蛋
    createNewEgg () {
      // 随机出新的egg的下标的x和y值
      this.eggX = this.random(0, this.rowNumber - 1)
      this.eggY = this.random(0, this.columnNumber - 1)

      if (this.snake.indexOf(this.mapLists[this.eggX].colList[this.eggY].key) > -1 || this.mapLists[this.eggX].colList[this.eggY].isEgg) {
        this.createNewEgg()
      } else {
        this.mapLists[this.eggX].colList[this.eggY].isEgg = true
      }
    },
    // 蛇运动
    snakeMove () {
      // 根据上面设置的方向来设置蛇头的位置
      switch (this.direction) {
        case 'left':
          --this.y
          break
        case 'right':
          ++this.y
          break
        case 'up':
          --this.x
          break
        case 'down':
          ++this.x
          break
      }
      // 是否撞墙了
      if (this.x < 0 || this.y < 0 || this.x >= this.rowNumber || this.y >= this.columnNumber) {
        this.isShowPop = true
        this.queryRanking();
        clearInterval(this.moveTimer)

        this.showStartBtn = 0
        return
      }
      // 是否吃到自己
      if (this.snake.indexOf(this.mapLists[this.x].colList[this.y].key) > -1) {
        this.isShowPop = true
        this.queryRanking();
        clearInterval(this.moveTimer)

        this.showStartBtn = 0
        return
      }
      // 吃到蛋了
      if (this.eggX === this.x && this.eggY === this.y) {
        this.mapLists[this.x].colList[this.y].isEgg = false
        ++this.scoreCount
        ++this.snakeLen
        this.createNewEgg()
      }
      // 前进
      this.snake.unshift(this.mapLists[this.x].colList[this.y].key)
      // 保持🐍的长度
      if (this.snakeLen < this.snake.length) {
        this.snake.pop()
      }
    },
    setDirection (direction) {
      // 先判断是否需要改变方向,true表示需要,false表示不需要
      if (!this.changeDir) return
      // 为了合理处理蛇的移动,需要判断蛇头和蛇身
      // 假设蛇向右移动,点方向键左,右键都不需要做出响应
      if (this.direction === 'right' && direction === 'left') return
      if (this.direction === 'left' && direction === 'right') return
      if (this.direction === 'up' && direction === 'down') return
      if (this.direction === 'down' && direction === 'up') return

      this.direction = direction
      this.changeDir = false
      setTimeout(() => {
        this.changeDir = true
      }, 30)
    },
    init () {
      let flag = 0
      // 从第几行开始
      this.x = this.random(this.snakeLen, this.rowNumber - this.snakeLen)
      // 从第几个开始
      this.y = this.random(this.snakeLen, this.columnNumber - this.snakeLen)
      // 创建🐍
      while (flag < this.snakeLen) {
        this.snake.push(this.mapLists[flag + this.x].colList[this.y].key)
        ++flag
      }
      // 创建蛋
      this.createNewEgg()
    },
    eventInit () {
      // 电脑键盘
      document.onkeydown = (e) => {
        e = e || e.event
        let direction = ''
        switch (e.keyCode) {
          case 37:
            // 向左
            direction = 'left'
            break
          case 38:
            // 向上
            direction = 'up'
            break
          case 39:
            // 向右
            direction = 'right'
            break
          case 40:
            // 向下
            direction = 'down'
            break
        }
        this.setDirection(direction)
      }
      // 手机手势
      var hammer = new Hammer(this.$refs.wrap)
      hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL })
      hammer
        .on('swipeleft', e => {
          this.setDirection('left')
        })
        .on('swiperight', e => {
          this.setDirection('right')
        })
        .on('swipeup', e => {
          this.setDirection('up')
        })
        .on('swipedown', e => {
          this.setDirection('down')
        })
    },
    // 计算行与列的数量和上下左右剩余
    computeNum () {
      this.remainTB = (window.innerHeight % 20) / 2
      this.remainLR = (window.innerWidth % 20) / 2
      this.rowNumber = (window.innerHeight - window.innerHeight % 20) / 20
      this.columnNumber = (window.innerWidth - window.innerWidth % 20) / 20
    },
    startGame () {
      return new Promise((resolve, reject) => {
        this.showCountdown = true
        var timer = setInterval(() => {
          if (this.countdown > 1) {
            --this.countdown
          } else {
            this.showCountdown = false
            clearInterval(timer)
            this.countdown = 3
            resolve()
          }
        }, 1000)
      })
    },
    reStart () {
      location.reload()
    },
    /*查询链上分数*/
    queryRanking () {
      var from = this.userAddress
      var value = '0'
      var nonce = '0'
      var gas_price = '1000000'
      var gas_limit = '2000000'

      // 获取排行榜列表
      var contract = {
          "function": "getUserScore",
          "args": ""
      }

      neb.api.call(
        from,
        dappAddress,
        value,
        nonce,
        gas_price,
        gas_limit,
        contract
      ).then( (resp) => {
            if (resp["result"] !== "null") {

              this.currUser = JSON.parse(resp["result"])
              this.blockchainScore = this.currUser.score
              console.log("当前用户链上分数", this.currUser.score)

            } else {

            }
        }).catch(function (err) {

            console.log("error:" + err.message)
        })

    },
    showLoading() {
      this.loading = this.$loading({
        lock: true,
        text: '上链中... 请稍后查看',
        background: 'rgba(0, 0, 0, 0.8)'
      });
      setTimeout(() => {
        loading.close();
      }, 300000);
    },
    toRanking () {
      // 上链
      console.log('上链 score', this.getScoreCount);

      if (this.getScoreCount === 0) {
        this.$message({
          message: '当前分数为0不能上链哦！',
          type: 'warning'
        });
        return;
      }

      if(this.blockchainScore > this.getScoreCount) {
        this.$message({
          message: '当前分数小于您已上链上的分数，继续努力哦！',
          type: 'warning'
        });
      } else {
        this.showLoading();

        // 链上保存分数
        var nebPay = new NebPay()

        var nickname = this.nickName
        var score = this.getScoreCount

        var value = "0"
        var callFunction = "ranking"
        var callArgs =JSON.stringify([nickname, score])
        console.log(callArgs)

        nebPay.call(
          dappAddress,
          value,
          callFunction,
          callArgs, {
            listener: this.callbackResult
          }
        );

      }

    },
    showRanking () {
      this.dialogRankingInfoVisible = true

      var from = this.userAddress
      var value = '0'
      var nonce = '0'
      var gas_price = '1000000'
      var gas_limit = '2000000'

      // 获取排行榜列表
      var contract = {
          "function": "getRanking",
          "args": ""
      }

      neb.api.call(
        from,
        dappAddress,
        value,
        nonce,
        gas_price,
        gas_limit,
        contract
      ).then( (resp) => {
            console.log("数据查询完成", resp)
            if (resp["result"] !== "null") {

              this.rankingList = JSON.parse(resp["result"]);
              // 安score进行排序
              if (this.rankingList.length) {
                this.rankingList = _.sortBy(this.rankingList, (obj, key) => {
                  return -obj.score
                })
              }

            } else {

            }
        }).catch(function (err) {

            console.log("error:" + err.message)
        })

    },
    // 开始
    start () {

      this.$prompt('请输入您的昵称', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPattern: /\S/,
          inputErrorMessage: '昵称不能为空'
        }).then(({ value }) => {
          this.showStartBtn = 0
          this.nickName = value
          this.startGame()
            .then(() => {
              this.eventInit()
              this.moveTimer = setInterval(this.snakeMove, this.speed)
            })
        }).catch(() => {

        });

    },
    callbackResult (response) {
      console.log("responseonse of push: " + JSON.stringify(response))

      if (JSON.stringify(response) === '"Error: Transaction rejected by user"') {

        if (this.loading) {
          this.loading.close();
        }

        this.init();

        this.$notify({
          title: '提示',
          message: '上链已被您拒绝，请重新开始',
          type: 'error'
        });

        return;
      }

      var intervalQuery = setInterval(() => {
        api.getTransactionReceipt({hash: response["txhash"]}).then((receipt) => {
            console.log("判断数据提交到区块链的状态", receipt)
            if (receipt.from) {
              this.userAddress = receipt.from;
              // 存在localStorage
              localStorage.setItem('userAddress', receipt.from);
            }
            // console.log(receipt)
            if (receipt["status"] === 2) {
                console.log("pending.....")
            } else if (receipt["status"] === 1){

                if (this.loading) {
                  this.loading.close();
                }

                this.$notify({
                  title: '上链成功',
                  message: '赶快点击排行榜查看排名吧',
                  type: 'success'
                })
                //清除定时器
                clearInterval(intervalQuery)
            }else {
                console.log("交易失败......")
                if (this.loading) {
                  this.loading.close();
                }

                this.init();

                this.$notify({
                  title: '上链失败',
                  message: '请重新再试',
                  type: 'warning'
                });


                //清除定时器
                clearInterval(intervalQuery)
            }
        });
      }, 3000);

    }
  },
  watch: {
    // 分数增加，速度加快
    scoreCount (val, oldval) {
      // 每长10分就增加一次速度
      if (val > oldval && val % 6 === 0 && this.speed > 100) {
        this.speed -= 100
      }
    }
  },
  created () {
    this.computeNum()
    this.setMapData()
  },
  mounted () {
    this.init()
  }
}
</script>

<style scoped>
.start-btn{
  text-align: right;
  display: inline-block;
  position: absolute;
  left: 50%;
  top: 50%;
  margin-top: -40px;
  margin-left: -60px;
  z-index: 8;
}
.ranking{
  text-align: right;
  display: inline-block;
  position: absolute;
  right: 20px;
  top: 20px;
  z-index: 8;
}
.logo-box{
  font-size: 18px;
  margin: 20px;
  position: absolute;
}
.logo-box .logo{
  width: 200px;
  vertical-align: middle;
  margin-right: 20px;
  margin-top: -5px;
}
.el-button--success{
  padding: 20px 30px;
  font-size: 30px;
}
.copyright{
  position: absolute;
  bottom: 0px;
  left: 0px;
  width: 100%;
  height: 30px;
  text-align: center;
  font-size: 14px;
  z-index: 8;
}
.copyright a{
  cursor: pointer;
}




.wrap {
  margin: 0 auto;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: 100% 100%;
  background-image: url('../assets/images/bg_new.jpg');
}
.main {
  margin: 0 auto;
  height: 100%;
  position: relative;
  width: 100%;

  /*margin: 0 auto;
  height: 80%;
  position: relative;
  width: 80%;
  border: 2px solid #333;*/
}
.pop-ups {
  width: 100%;
  height: 100%;
  background: rgb(0, 0, 0, .5);
  position: absolute;
  top: 0;
  left: 0;
  z-index: 9;
  text-align: center;
}
.countdown-wrap__text {
  font-family: 微软雅黑;
  font-size: 200px;
  color: #fff;
  opacity: 0.8;
  height: 200px;
  line-height: 200px;
  position: absolute;
  width: 100%;
  margin: auto;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
}
.pop-ups__content {
  background: #fff;
  width: 60%;
  position: absolute;
  max-width: 320px;
  padding: 18px;
  font-family: 微软雅黑;
  top: 50%;
  left: 50%;
  transform: translate3d(-50%, -50%, 0);
}
.pop-ups__content .title {
  font-size: 22px;
  text-align: center;
  color: #333;
  font-weight: bold;
}
.pop-ups__content .desc {
  text-align: center;
  color: #666;
  font-size: 16px;
  margin-top: 15px;
  margin-bottom: 20px;
}
.code-img {
  width: 100%;
  font-size: 0;
  display: block;
}
.reStart {
  padding: 0 15px;
  height: 30px;
  line-height: 30px;
  color: #fff;
  font-size: 14px;
  background: rgb(139, 195, 74);
  box-shadow: 0;
  border: 0;
  border-radius: 15px;
  cursor: pointer;
  margin-top: 10px;
}
.toRanking{
  padding: 0 15px;
  height: 30px;
  line-height: 30px;
  color: #fff;
  font-size: 14px;
  background: #f56c6c;
  box-shadow: 0;
  border: 0;
  border-radius: 15px;
  cursor: pointer;
  margin-top: 10px;
  margin-left: 10px;
}
/* .score-col {
  width: 40%;
  height: rem(80px);
  line-height: rem(80px);
  position: absolute;
  top: 0px;
  left: 50%;
  margin-left: -20%;
  background: #000;
  text-align: center;
  border-radius: 0 0 rem(30px) rem(30px);
  opacity: .5;
  color: #ffffff;
  font-size: rem(38px);
} */
.map {
  width: 100%;
  height: 100%;
}
.map-row {
  width: 100%;
  height: 20px;
  overflow: hidden;
}
.map-col {
  height: 20px;
  width: 20px;
  float: left;
  transition: all .3s;
}
.snake-part {
  height: 100%;
  width: 100%;
  background-size: 100% 100%;
  border-radius: 50%;
}
.snake-part.header {
  background-image: url('../assets/images/st.png')
}
.snake-part.body {
  background-image: url('../assets/images/sb2.png')
}
.snake-part.footer {
  background-image: url('../assets/images/sf.png')
}
.snake-part.header.rotate90 {
  transform: rotate(90deg);
}
.snake-part.header.rotate180 {
  transform: rotate(180deg);
}
.snake-part.header.rotate270 {
  transform: rotate(270deg);
}
.snake-part.footer.rotate90 {
  transform: rotate(90deg);
}
.snake-part.footer.rotate180 {
  transform: rotate(180deg);
}
.snake-part.footer.rotate270 {
  transform: rotate(270deg);
}
/* .snake-part.active {
  border-radius: 35%;
  background: rgb(255, 87, 34);
} */
.snake-part.egg {
  background-image: url('../assets/images/egg.png');
}
.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>
