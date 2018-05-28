'use strict';

//玩家 数据结构
var User = function(item) {
    if (item) {
        var obj = JSON.parse(item);
        this.address = obj.address;
        this.nickname = obj.nickname
        this.score = obj.score;
    } else {
        this.address = "";
        this.nickname = "";
        this.score = 0;
    }
};

User.prototype = {
    toString: function() {
        return JSON.stringify(this);
    }
};


var SnakeContract = function() {
    LocalContractStorage.defineProperty(this, "number");
    LocalContractStorage.defineMapProperty(this, "rankingList", {
        parse: function(item) {
            return new User(item);
        },
        stringify: function(obj) {
            return obj.toString();
        }
    });
};



SnakeContract.prototype = {
    init: function() {
      this.number = 0;
    },
    toString: function() {
        return JSON.stringify(this);
    },
    /*排行榜事件*/
    ranking: function(nickname, score) {
        // 自动获取当前钱包检测到的登录钱包地址
        var from = Blockchain.transaction.from;


        var hasCurrUser;

        for(var i=0; i<this.number; i++){
          var tempObj = JSON.parse(this.rankingList.get(i));
          if (tempObj.address === from) {
            this.rankingList.del(i);
            this.number --;

            hasCurrUser = new User();

            hasCurrUser.address = from;
            hasCurrUser.nickname = nickname;
            hasCurrUser.score = score;

            this.rankingList.put(this.number, hasCurrUser);
            this.number ++;
          }
        }

        if (!hasCurrUser) {

          var gamerItem = new User();
          gamerItem.address = from;
          gamerItem.nickname = nickname;
          gamerItem.score = score;


          this.rankingList.put(this.number, gamerItem);

          this.number ++;
        }
    },
    /*获取排行榜列表*/
    getRanking: function() {
      var from = Blockchain.transaction.from;
      var list = [];

      for(var i=0; i<this.number; i++){
        var tempObj = JSON.parse(this.rankingList.get(i));
        list.push(tempObj);
      }

      return list;
    },
    /*上链之前先去查询该用户的分数，如果本局分数低于链上分数，提醒用户再接再厉*/
    getUserScore: function() {
      var from = Blockchain.transaction.from;

      var currUser;

      for(var i=0; i<this.number; i++){
        var tempObj = JSON.parse(this.rankingList.get(i));
        if (tempObj.address === from) {
          currUser = tempObj;
        }
      }

      if (currUser) {
        return currUser;
      } else {
        return 'none ranking';
      }
    }
};

module.exports = SnakeContract;
