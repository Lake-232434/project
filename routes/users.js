var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var router = express.Router();

var url = 'mongodb://127.0.0.1:27017';
/* GET users listing. */
router.get('/', function (req, res, next) {

  MongoClient.connect(url, { userNewUrlParser: true }, function (err, client) {
    if (err) {
      console.log('链接数据库失败', err);
      res.render('error', {
        message: '链接数据库失败',
        error: err
      });
      return;
    }
    var db = client.db('project');

    db.collection('user').find().toArray(function (err, data) {
      if (err) {
        console.log('查询用户数据失败', err);
        res.render('error', {
          message: '查询失败',
          error: err
        })
      }
      else {
        console.log(data);
        res.render('users', {
          list: data
        });
      }
      client.close();
    })
  });
});

router.post('/login', function (req, res) {
  var username = req.body.name;
  var password = req.body.pwd;
  if (!username) {
    res.render('error', {
      message: '用户名不能为空',
      error: new Error('用户名不能为空')
    })
    return;
  }

  if (!password) {
    res.render('error', {
      message: '密码不能为空',
      error: new Error('密码不能为空')
    })
    return;
  }
  MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
    if (err) {
      console.log('连接失败', err);
      res.render('error', {
        message: '连接失败',
        error: err
      })
      return;
    }
    var db = client.db('project');
    db.collection('user').find({
      username: username,
      password: password
    }).toArray(function(err,data){
      if(err){
        console.log('查询失败',err);
        res.render('error',{
          message: '查询失败',
          error:err
        })
      }else if (data.length <= 0){
        res.render('error',{
          message: '登录失败',
          error: new Error('登录失败')
        })
      }else{
        res.cookie('nickname',data[0].nickname,{
          maxAge: 10*60*1000
        })
         res.redirect('/');
      }
      client.close();
    })
  })
})

module.exports = router;
