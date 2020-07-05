import {tag as db} from './global.js'

const Q = require('q')

export function insert (data) {
  let defer = Q.defer()
  const insertFn = function (data) {
    data.id = new Date().format('yyyyMMddhhmmss')
    db.loadDatabase(function (err) {
      if (err) {
        defer.reject(err)
        return
      }
      db.insert(data, function (err, newDoc) {
        if (err) {
          defer.reject(err)
        } else {
          defer.resolve(newDoc)
        }
      })
    })
    return defer.promise
  }
  db.loadDatabase(function (err) {
    if (err) {
      defer.reject(err)
      return
    }
    db.find({name: data.name}).exec(function (err, docs) {
      if (err) {
        defer.reject(err)
        return
      }
      if (docs.length === 0) {
        insertFn(data)
      }
    })
  })
  return defer.promise
}

export function getAll () {
  var defer = Q.defer()
  db.loadDatabase(function (err) {
    console.log(err)
    db.find({}).projection({name: 1}).sort({name: -1}).exec(function (err, docs) {
      if (err) {
        defer.reject(err)
      } else {
        defer.resolve(docs)
      }
    })
  })
  return defer.promise
}

export function del (data) {
  var defer = Q.defer()
  db.loadDatabase(function (err) {
    console.log(err)
    db.remove({_id: data._id}, {}, function (err, numRemoved) {
      if (err) {
        defer.reject(err)
      } else {
        defer.resolve(numRemoved)
      }
    })
  })
  return defer.promise
}
export function findByName (name) {
  var defer = Q.defer()
  db.find({name: name}, function (err, docs) {
    if (err) {
      defer.reject(err)
      return
    }
    defer.resolve(docs)
  })
  return defer.promise
}

export function search (keyword) {
  if (keyword === '') {
    return this.getAll()
  }
  var defer = Q.defer()
  var reg1 = new RegExp('(' + keyword + ')', 'i')
  db.find({name: {$regex: reg1}}, function (err, docs) {
    if (err) {
      defer.reject(err)
      return
    }
    defer.resolve(docs)
  })
  return defer.promise
}
