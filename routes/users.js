var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var objectId = require('mongodb').ObjectId;
var async = require('async');
var router = express.Router();

var url = 'mongodb://127.0.0.1:27017';
/* GET users listing. */
router.get('/', function (req, res, next) {
  var page = parseInt(req.query.page) || 1;
  var pageSize = parseInt(req.query.pageSize) || 5;
  var totalSize = 0;
  var data = [];

  MongoClient.connect(url, { userNewUrlParser: true }, function(err, client) {
    if (err) {
      res.render('error', {
        message: '链接失败',
        error: err
      });
      return;
    }
    var db = client.db('project');

    async.series([
      function (cb) {
        db.collection('user').find().count(function (err, num) {
          if (err) {
            cb(err);
          }
          else {
            totalSize = num;
            cb(null);
          }
        })
      },
      function (cb) {
        db.collection('user').find().limit(pageSize).skip(page * pageSize - pageSize).toArray(function (err, data) {
            if (err) {
              cb(err)
            } else {
              cb(null, data)
            }
          })
      }
    ], function (err, results) {
      if (err) {
        res.render('error', {
          message: '错误',
          error: err
        })
      } else {
        var totalPage = Math.ceil(totalSize/pageSize);

        res.render('users', {
          list: results[1],
          totalPage: totalPage,
          pageSize: pageSize,
          currentPage: page
        })
      }
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
    }).toArray(function (err, data) {
      if (err) {
        console.log('查询失败', err);
        res.render('error', {
          message: '查询失败',
          error: err
        })
      } else if (data.length <= 0) {
        res.render('error', {
          message: '登录失败',
          error: new Error('登录失败')
        })
      } else {
        res.cookie('nickname', data[0].nickname, {
          maxAge: 10 * 60 * 1000
        })
        res.redirect('/');
      }
      client.close();
    })
  })
});

router.post('/register', function (req, res) {
  var username = req.body.name;
  var pwd = req.body.pwd;
  var nickname = req.body.nickname;
  var age = parseInt(req.body.age);
  var sex = req.body.sex;
  var isAdmin = req.body.isAdmin === '是' ? true : false;

  MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
    if (err) {
      res.render('error', {
        message: '链接失败',
        error: err
      })
      return;
    }
    var db = client.db('project');

    async.series([
      function (cb) {
        db.collection('user').find({ username: username }).count
          (function (err, num) {
            if (err) {
              cb(err)
            } else if (num > 0) {
              cb(new Error('已经注册'));
            } else {
              cb(null);
            }
          })
      },

      function (cb) {
        db.collection('user').insertOne({
          username: username,
          password: pwd,
          nickname: nickname,
          age: age,
          sex: sex,
          isAdmin: isAdmin,
        }, function (err) {
          if (err) {
            cb(err);
          } else {
            cb(null);
          }
        })
      }
    ], function (err, result) {
      if (err) {
        res.render('error', {
          message: '错误',
          error: err
        })
      } else {
        res.redirect('/login.html');
      }
      client.close();
    })
  })
});

router.get('/delete', function (req, res) {

  var id = req.query.id;


  MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
    if (err) {
      res.render('error', {
        message: '链接失败',
        error: err
      })
      return;
    }
    var db = client.db('project');
    db.collection('user').deleteOne({
      _id: objectId(id)
    }, function (err) {
      if (err) {
        res.render('error', {
          message: '删除失败',
          error: err
        })
      } else {
        res.redirect('/users');
      }
      client.close();
    })
  })
})

module.exports = router;
