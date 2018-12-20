// Load required packages
var User = require('../models/userModels');
var Mahasiswa = require('../models/mahasiswaModels');
var Petugas = require('../models/petugasModels');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt-nodejs');


// Create endpoint /api/users for POST
exports.create_mahasiswa = function(req, res) {
  var user = new Mahasiswa({
    username: req.body.username,
    password: req.body.password,
    nama: req.body.nama,
    email: req.body.email,
    telepon: req.body.telepon,
    nim: req.body.nim,
    angkatan: req.body.angkatan
  });

  user.save(function(err) {
    if (err){
      return res.status(409).json(err);
    };
    return res.json('Mahasiswa created');
  });
};

exports.create_petugas = function(req, res) {
  var user = new Petugas({
    username: req.body.username,
    password: req.body.password,
    nama: req.body.nama,
    email: req.body.email,
    telepon: req.body.telepon,
  });

  user.save(function(err) {
    if (err){
      return res.status(409).json(err);
    };
    return res.json('Petugas created');
  });
};

exports.login_user = function(req, res) {
  User.findOne({ username: req.body.username })
  .exec()
  .then(user =>
  {
    
    if (!user) 
    {
      return res.status(401).json('user not found');
    }

    if(user.status=='waiting') return res.status(403).json('user status: WAITING, need admin approval first.')
    user.verifyPassword(req.body.password, function(err, isMatch) {
      if (err) { return res.status(401).json(err) }

      // Password did not match
      if (!isMatch) { return res.status(401).json('wrong password') }

      // Success
      token = jwt.sign({
        userId: user._id,
        username: user.username,
        role: user.role
      }, 
      'secretkey',
      {
        expiresIn: "12h"
      });
      res.json(token);
    });
  })
}

exports.edit_user_status = function(req, res){
  User.findOneAndUpdate(
    { _id: req.body.idUser }, { $set: { 
      status: 'approved', 
      privilege: req.body.privilege
    }}
  )
  .exec()
    .then(result => {
        res.status(200).json({
            result,
            message: "User updated",
            request: {
                type: "PATCH"
            }
        });
    })
    .catch(err => {
        res.status(500).json({
            error: err
        });
    })
}

exports.delete_user = function(req, res){
  User.findOneAndRemove(
    {_id: req.params.idUser, status: 'waiting'}
  )
  .exec()
  .then(result => {
    if (result) res.status(200).json({result, message: 'user deleted'});
    else res.status(401).json('user not found')
  })
}

exports.get_user_waiting = function(req, res){
  User.find({status: 'waiting'})
  .exec()
  .then(result => {
    res.status(200).json(result);
  })
}

exports.change_password = function(req, res) {
  User.findOne({ username: req.userData.username })
  .exec()
  .then(user =>
  {
    if (!user) 
    {
      return res.status(401).json('user not found');
    }
    user.verifyPassword(req.body.old_password, function(err, isMatch) {
      if (err) { return res.status(401).json(err) }

      // Password did not match
      if (!isMatch) { return res.status(401).json('wrong password') }

      bcrypt.genSalt(5, function(err, salt) {
        if (err) return res.json(err)
    
        bcrypt.hash(req.body.new_password, salt, null, function(err, hash) {
          if (err) return res.json(err)

          User.findOneAndUpdate(
            {username: req.userData.username}, { $set: { password: hash }}
          )
          .exec()
            .then(result => {
                res.status(200).json({
                    result,
                    message: "Password updated",
                    request: {
                        type: "PATCH"
                    }
                });
            })
            .catch(err => {
                res.status(500).json({
                    error: err
                });
            })
        });
      });

      
    });
  })
}

// Create endpoint /api/users for GET
exports.get_mahasiswa = function(req, res) {
    User.findById(req.userData.userId, '_id username nama email telepon nim angkatan')
    .exec()
    .then(result => {
      res.status(200).json(result);
    })
    .catch(err => {
      res.status(500).json({
        error: err
      });
    })
}; 

exports.get_petugas = function(req, res) {
  User.findById(req.userData.userId, '_id username nama email telepon')
  .exec()
  .then(result => {
    res.status(200).json(result);
  })
  .catch(err => {
    res.status(500).json({
      error: err
    });
  })
}; 