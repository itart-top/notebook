import {favorite} from './global.js'
const Q = require('q')

export function update (data) {
  let defer = Q.defer()
  favorite.loadDatabase(function (err) {
    if (err) {
      defer.reject(err)
      return
    }
    favorite.update({_id: data._id}, {
      $set: {
        text: data.text,
        url: data.url,
        command: data.command,
        parentId: data.parentId,
        exec: data.exec,
        opened: data.opened,
        modifiedTime: data.modifiedTime
      }
    }, {}, function (err, numReplaced, updatedDocs) {
      if (err) {
        defer.reject(err)
      } else {
        defer.resolve(updatedDocs)
      }
    })
  })
  return defer.promise
}

export function insert (data) {
  data.createdTime = new Date()
  data.modifiedTime = new Date()
  let defer = Q.defer()
  favorite.loadDatabase(function (err) {
    if (err) {
      defer.reject(err)
      return
    }
    favorite.insert(data, function (err, newDoc) {
      if (err) {
        defer.reject(err)
      } else {
        defer.resolve(newDoc)
      }
    })
  })
  return defer.promise
}

export function get (id) {
  var defer = Q.defer()
  favorite.findOne({_id: id}, function (e, doc) {
    if (e) {
      defer.reject(e)
    } else {
      defer.resolve(doc)
    }
  })
  return defer.promise
}

export function read (id) {
  let defer = Q.defer()
  favorite.loadDatabase(function (err) {
    if (err) {
      defer.reject(err)
      return
    }
    favorite.findOne({id: id}, {}, function (err, data) {
      if (err) {
        defer.reject(err)
      } else {
        defer.resolve(data)
      }
    })
  })
  return defer.promise
}

export function getAll () {
  var defer = Q.defer()
  favorite.loadDatabase(function (err) {
    console.log(err)
    favorite.find({}).projection({}).sort({flag: -1, modifiedTime: -1}).exec(function (err, docs) {
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
  favorite.loadDatabase(function (err) {
    console.log(err)
    favorite.remove({_id: data._id}, {}, function (err, numRemoved) {
      if (err) {
        defer.reject(err)
      } else {
        defer.resolve(numRemoved)
      }
    })
  })
  return defer.promise
}

export function search (search) {
  console.log('search ---')
  const keyword = search.keyword
  if (!keyword && !search.tag) {
    return getAll()
  }
  var defer = Q.defer()
  const query = {}
  if (keyword) {
    var reg1 = new RegExp('(' + keyword + ')', 'i')
    query.$or = [{plainContent: {$regex: reg1}}, {name: {$regex: reg1}}]
  }
  if (search.tag) {
    query.tags = search.tag
  }
  favorite.loadDatabase(function (err) {
    if (err) {
      console.error(err)
      return
    }
    favorite.find(query, function (err, docs) {
      if (err) {
        defer.reject(err)
        return
      }
      var reg = new RegExp('(' + keyword + ')', 'ig')
      var lines
      var line
      for (var i = 0; i < docs.length; i++) {
        docs[i].name = docs[i].name.replace(reg, '<font color="red">$1</font>')
        lines = docs[i].plainContent.split(/[\n\s]/)
        var matchLines = []
        for (var j = 0; j < lines.length; j++) {
          line = lines[j]

          if (line.match(reg)) {
            matchLines.push(line.replace(reg, '<font color="red">$1</font>'
            ))
          }
        }
        if (matchLines.length !== 0) {
          docs[i].summary = matchLines.join('<br/>')
        }
      }
      defer.resolve(docs)
    })
  })
  return defer.promise
}
