import Vue from 'vue'
import axios from 'axios'

import App from './App'
import router from './router'
import { Tabs, TabPane, Button, Input, Menu, MenuItem, Tag, Select, Option } from 'element-ui'
import store from './store'
/* import 'bootstrap/dist/js/bootstrap.bundle.min'
import 'bootstrap/dist/css/bootstrap.css'
import 'summernote/dist/summernote-bs4.js'

import 'summernote/dist/summernote-bs4.css' */

import 'summernote/dist/summernote-lite.js'
import 'summernote/dist/summernote-lite.css'

Vue.use(Tabs)
Vue.use(TabPane)
Vue.use(Button)
Vue.use(Input)
Vue.use(Menu)
Vue.use(MenuItem)
Vue.use(Tag)
Vue.use(Select)
Vue.use(Option)

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

/* eslint-disable*/
Date.prototype.format = function (fmt) {
  var o = {
    'M+': this.getMonth() + 1, // 月份
    'd+': this.getDate(), // 日
    'h+': this.getHours(), // 小时
    'm+': this.getMinutes(), // 分
    's+': this.getSeconds(), // 秒
    'q+': Math.floor((this.getMonth() + 3) / 3), // 季度
    'S': this.getMilliseconds() // 毫秒
  }
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length))
  }
  for (var k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)))
    }
  }
  return fmt
}

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
