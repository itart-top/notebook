import {db} from './global.js'

import path from 'path'
const fs = require('fs')
const Q = require('q')

export function update (data) {
  let defer = Q.defer()
  db.loadDatabase(function (err) {
    if (err) {
      defer.reject(err)
      return
    }
    db.update({_id: data._id}, {
      $set: {
        content: data.content,
        plainContent: data.plainContent,
        summary: data.summary,
        name: data.name,
        flag: data.flag,
        tags: data.tags,
        modifiedTime: data.modifiedTime
      }
    }, {returnUpdatedDocs: true}, function (err, numReplaced, updatedDocs) {
      if (err) {
        defer.reject(err)
      } else {
        defer.resolve(updatedDocs)
      }
    })
  })
  return defer.promise
}

export function flag (data) {
  let defer = Q.defer()
  db.loadDatabase(function (err) {
    if (err) {
      defer.reject(err)
      return
    }
    db.update({_id: data._id}, {
      $set: {
        flag: data.flag,
        modifiedTime: new Date()
      }
    }, {returnUpdatedDocs: true}, function (err, numReplaced, updatedDocs) {
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
  console.log(data)
  let defer = Q.defer()
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

export function get (id) {
  var defer = Q.defer()
  db.find({id: id}, function (e, docs) {
    if (e) {
      defer.reject(e)
    } else {
      defer.resolve(docs)
    }
  })
  return defer.promise
}

export function read (id) {
  let defer = Q.defer()
  db.loadDatabase(function (err) {
    if (err) {
      defer.reject(err)
      return
    }
    db.findOne({id: id}, {content: 1}, function (err, data) {
      if (err) {
        defer.reject(err)
      } else {
        defer.resolve(data.content)
      }
    })
  })
  return defer.promise
}

export function getAll () {
  var defer = Q.defer()
  db.loadDatabase(function (err) {
    console.log(err)
    db.find({}).projection({content: 0}).sort({flag: -1, modifiedTime: -1}).exec(function (err, docs) {
      if (err) {
        defer.reject(err)
      } else {
        defer.resolve(docs)
      }
    })
  /*    db.find({}, {content: 0}, function (err, docs) {
      if (err) {
        defer.reject(err)
      } else {
        defer.resolve(docs)
      }
    }) */
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
  db.loadDatabase(function (err) {
    if (err) {
      console.error(err)
      return
    }
    db.find(query, function (err, docs) {
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
const blobToBase64 = function (blob) {
  return new Promise((resolve, reject) => {
    const a = new FileReader()
    a.onload = function (e) {
      resolve(e.target.result)
    }
    a.readAsDataURL(blob)
  })
}

const createFile = function (destPath, file) {
  return new Promise((resolve, reject) => {
    const doCreateFile = function (resolve, reject) {
      if (!file.path) {
        blobToBase64(file).then(data => {
          data = data.replace(/^data:image\/png;base64,/, '')
          let fileName = new Date().getTime() + '.png'
          fs.writeFileSync(destPath + fileName, data, 'base64', (err) => {
            if (err) throw err
          })
          resolve(fileName)
        })
        return
      }
      let fileName = path.basename(file.path)
      fs.writeFileSync(destPath + fileName, fs.readFileSync(file.path), (err) => {
        if (err) throw err
      })
      resolve(fileName)
    }
    if (!fs.existsSync(destPath)) {
      makeDir(destPath)
    }
    doCreateFile(resolve, reject)
  })
}

export function insertImage (data, files) {
  let relativePath = '../../../db/resource/' + data.id + '/'
  let destPath = path.join(__dirname, relativePath)
  // const relativePaths = []
  console.log('destPath', destPath)
  const promises = []
  for (let i = 0; i < files.length; i++) {
    promises.push(createFile(destPath, files[i]))
  }
  return Promise.all(promises).then(fileNames => {
    return fileNames.map(fileName => {
      return relativePath + fileName
    })
  })
}

function makeDir (dirpath) {
  if (!fs.existsSync(path.dirname(dirpath))) {
    makeDir(path.dirname(dirpath))
  }
  fs.mkdirSync(dirpath)
}
