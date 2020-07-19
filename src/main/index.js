'use strict'
// shell
import { app, shell, BrowserWindow, ipcMain, Tray, Menu, MenuItem } from 'electron'
// const exec = require('child_process').exec
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

const iconPath = require('path').join(__static, '/icon/icon.ico')

let tray = null
let detailWin
let delayDetailWin

app.on('web-contents-created', (e, webContents) => {
  webContents.on('new-window', (event, url) => {
    event.preventDefault()
    shell.openExternal(url)
  })
})

app.on('ready', () => {
  tray = new Tray(iconPath)
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Item3', type: 'radio', checked: true },
    {
      label: '退出',
      click: function () {
        closeApp()
      }
    }
  ])
  tray.setToolTip('我的笔记')
  tray.on('double-click', function () {
    mainWindow.isVisible() && !mainWindow.isMinimized() ? mainWindow.hide() : mainWindow.show()
  })
  tray.setContextMenu(contextMenu)
})
function closeApp () {
  mainWindow && mainWindow.close()
  let allWindows = BrowserWindow.getAllWindows()
  let win
  for (let i = 0; i < allWindows.length; i++) {
    win = allWindows[i]
    win.isDestroyed() || win.close()
  }
  tray.destroy()
  mainWindow = null
  app.quit()
}
function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    title: '虾记',
    width: 300,
    height: 700,
    // alwaysOnTop: true,
    // resizable: false,
    thickFrame: true,
    useContentSize: true,
    transparent: true, // 透明
    show: false,
    skipTaskbar: true, // 不在任务栏显示
    icon: iconPath,
    frame: false // 无边框
  })
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
  mainWindow.loadURL(winURL)
  mainWindow.on('closed', () => {
    mainWindow = null
  })
  // 主界面打开后延迟初始化detail,优化查看详细展示速度
  delayDetailWin = setTimeout(createDetailWin, 2000)
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.on('open-detail', (event, item) => {
  createDetailWin(item).then(r => {
    detailWin.webContents.send('win-detail', item)
  })
  if (!detailWin.isVisible() || detailWin.isMinimized()) {
    setDetailPosition() // 设置detail位置
  }
  detailWin.show()
})
function setDetailPosition () {
  const offset = 10
  let detailX = mainWindow.getBounds().x - detailWin.getBounds().width - offset + 12
  if (detailX < 0) {
    detailX = mainWindow.getBounds().x + mainWindow.getBounds().width + offset - 12
  }
  detailWin.setPosition(detailX, mainWindow.getBounds().y + 5)
}
function createDetailWin (item) {
  delayDetailWin && clearTimeout(delayDetailWin) // 清除延迟创建窗口
  return new Promise((resolve, reject) => {
    if (detailWin) {
      resolve({init: false})
      return
    }
    detailWin = new BrowserWindow({
      width: 900,
      height: 698,
      transparent: true, // 透明
      show: false,
      webPreferences: { webSecurity: false },
      // alwaysOnTop: true,
      resizable: false,
      icon: iconPath,
      frame: false // 无边框
      // parent: mainWindow // win是主窗口
    })
    setDetailPosition() // 设置detail位置
    detailWin.webContents.on('did-finish-load', () => {
      resolve({init: true})
      /* if (item) {
          detailWin.webContents.send('win-detail', item)
      } */
    })
    detailWin.on('closed', () => {
      detailWin = null
    })
    detailWin.loadURL(winURL + '#detail') // new.html是新开窗口的渲染进程
  })
}
ipcMain.on('main-win-close', function () {
  closeApp()
})

ipcMain.on('main-win-min', function () {
  mainWindow.hide()
  // mainWindow.minimize()
})

ipcMain.on('detail-win-close', function () {
  detailWin.hide()
})
ipcMain.on('detail-win-min', function () {
  detailWin.minimize()
})

ipcMain.on('detail-win-full', function (event, flag) {
  detailWin.setFullScreen(flag)
})

ipcMain.on('list-refresh', (event, data) => {
  mainWindow.webContents.send('list-refresh', data)
})

ipcMain.on('right-menu', (event, data) => {
  //! 生成菜单
  const menu = new Menu()
  /* menu.append(new MenuItem({
    label: data.flag ? '拔旗' : '插旗',
    click: () => {
      mainWindow.webContents.send('list-:type-right-menu'.replace(':type', data.type), {id: data.id, action: 'flag'})
    }
  }))
  menu.append(new MenuItem({type: 'separator'})) */
  menu.append(new MenuItem({
    label: '删除',
    click: () => {
      mainWindow.webContents.send('list-:type-right-menu'.replace(':type', data.type), {id: data.id, action: 'del'})
    }
  }))
  // menu.append(new MenuItem({type: 'separator'}))
  // menu.append(new MenuItem({
  //   label: 'Electron',
  //   click: () => {
  //     shell.openExternal('https://www.baidu.com')
  //   }
  // })
  // )
  const win = BrowserWindow.fromWebContents(event.sender)
  menu.popup(win)
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
