import DataStore from 'nedb'
import path from 'path'
import { remote } from 'electron'

const dbPath = remote.app.getPath('userData')
const filePath = path.join(dbPath, '/file')
const db = new DataStore({
  filename: path.join(dbPath, '/data.db')
})
const tag = new DataStore({
  filename: path.join(dbPath, '/tag.db')
})
export {
  db,
  tag,
  filePath
}
