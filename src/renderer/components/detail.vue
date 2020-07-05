<template>
    <div class="detail-win" :style="{height: win.height-8 + 'px'}" :class="{ 'open-side-menu': list.length > 1 }">
        <div ref="side-menu" class="side-menu"
             :style="{height: win.height-10 + 'px'}">
            <el-menu @select="onSelect" :default-active="active">
                <el-menu-item :index="row.id"  v-for = "(row, index) in list" :key="row.id">
                    <span>
                        <span> {{row.name}}</span>
                         <el-button type="warning" @click.stop="close(index)"
                                    style="position: absolute; right: 0; top: -5px"
                                    icon="el-icon-close"></el-button>
                    </span>
                </el-menu-item>
            </el-menu>
        </div>
        <div class="main-panel">
            <div class="top-bar">
                <el-button type="primary" size="mini" @click="save" style="float: left" icon="el-icon-check">保存</el-button>
                <el-button type="text" size="mini" icon="el-icon-minus" @click="() => onMinScreen()"></el-button>
                <el-button type="text" size="mini" icon="el-icon-full-screen" @click="() => onFullScreen()"></el-button>
                <el-button type="text" size="mini" icon="el-icon-close" @click="onClose"></el-button>
            </div>
            <div class="header-panel">
                <div class="header-row">
                    <el-input v-model="currItem.name"
                              placeholder="标题"
                              size="mini" class="title">
                    </el-input>
                </div>
                <div class="header-row">
                    <el-select  size="mini"
                                style="width: 100%"
                                v-model="currItem.tags"
                                multiple
                                filterable
                                allow-create
                                default-first-option
                                placeholder="分类">
                        <el-option
                                v-for="item in tags"
                                :key="item.name"
                                :label="item.name"
                                :value="item.name">
                        </el-option>
                    </el-select>
                </div>
            </div>
            <div id="summernote" v-model="richContent"></div>
        </div>
    </div>
</template>

<script>
  import { read as readApi, update as updateApi, insert as insertApi, insertImage as insertImageApi } from '@/api/blog'
  import { insert as tagInsertApi, getAll as tagAllApi } from '@/api/tag'
  import $ from 'jquery'
  const { ipcRenderer } = require('electron')
  const ipc = require('electron').ipcRenderer
  export default {
    name: 'PostDetail',
    data () {
      return {
        richContent: undefined,
        list: [],
        tags: [],
        currItem: { content: undefined },
        // content: '<h2>I am Example</h2>',
        editorOption: {
          // some quill options
        },
        timeout: undefined,
        histories: [],
        fullscreen: false,
        $toolbar: undefined,
        $editable: undefined,
        $codable: undefined,
        win: {
          height: document.body.clientHeight,
          width: document.body.clientWidth
        }
      }
    },
    watch: {
      win: {
        handler (v) {
          this.$nextTick(this.resize)
        },
        deep: true,
        immediate: true
      },
      list: {
        handler (v) {
          this.$nextTick(this.resize)
        },
        deep: true
      },
      'currItem.id': {
        handler (v) {
          this.editorElement.summernote('code', this.currItem.content || '')
        },
        deep: true
      }
    },
    created () {
      tagAllApi().then(r => {
        this.tags = r
      })
      ipcRenderer.on('win-detail', (e, cmd) => {
        const selected = this.list.find(item => item.id === cmd.data.id)
        if (selected) {
          this.currItem = selected
          return
        }
        if (cmd.type === 'favorite' && cmd.action === 'view') {
          readApi(cmd.data.id).then(r => {
            cmd.data.content = r
            this.currItem = cmd.data
            this.currItem.type = cmd.type
            this.currItem.action = cmd.action
            this.list.push(this.currItem)
          }).catch(err => {
            console.log('err', err)
          })
        }
        if (cmd.type === 'favorite' && cmd.action === 'add') {
          this.currItem = cmd.data
          this.currItem.type = cmd.type
          this.currItem.action = cmd.action
          this.list.push(this.currItem)
        }
      })
      const key = 'favorite_' + this.currItem.id
      let histories = []
      if (localStorage[key]) {
        histories = JSON.parse(localStorage[key])
      }
      this.histories = histories
    },
    mounted () {
      (function ($, _this) {
        // Check for the text editor
        if ($.fn.summernote) {
          _this.editorElement = $('#summernote') // I like to use refs instead of $(selector)
          // Init the Awesome Text Editor
          _this.editorElement.summernote({
            placeholder: '输入内容',
            lang: 'zh-CN',
            height: 350,
            disableResizeEditor: true,
            toolbar: [
              ['style', ['style']],
              ['font', ['bold', 'underline', 'clear']],
              ['fontname', ['fontname']],
              ['color', ['color']],
              ['para', ['ul', 'ol', 'paragraph']],
              ['table', ['table']],
              ['insert', ['link', 'picture']],
              ['view', ['codeview']] // fullscreen',
            ],
            callbacks: {
              onImageUpload: function (files) {
                insertImageApi(_this.currItem, files).then(pathes => {
                  console.log('paths', pathes)
                  pathes.forEach(path => {
                    _this.editorElement.summernote('insertImage', path, 'test')
                  })
                })
              },
              onChange: function (contents, $editable) {
                _this.currItem.plainContent = $('<span>' + _this.editorElement.summernote('code') + '</span>').text()
                _this.currItem.content = contents
              },
              onInit: function () {
                _this.editorElement.summernote('code', _this.currItem.content)
                _this.$toolbar = $('div.note-toolbar')
                _this.$editable = $('div.note-editable')
                _this.$codable = $('textarea.note-codable')
                _this.resize()
              },
              onKeyup: function (e) {
                if (e.keyCode === 83 && e.ctrlKey) {
                  _this.save()
                }
              }
            }
          })
        } else {
          // TODO: load error message in UI
          alert('The text editor is not loaded properly for the content.  Please contact an administrator.')
        }
      })($, this)
      window.onresize = () => {
        this.win.height = document.body.clientHeight
        this.win.width = document.body.clientWidth
      }
      const _this = this
      const sideMenuRef = this.$refs['side-menu']
      sideMenuRef.addEventListener('webkitTransitionEnd', function (e) {
        if (e.target === e.currentTarget) {
          _this.resize()
        }
      })
    },
    methods: {
      resize () {
        if (!this.$toolbar) {
          return
        }
        const height = this.win.height - this.$toolbar.outerHeight() - $('.top-bar').outerHeight() - $('.header-panel').outerHeight() - 20
        this.$editable.css('height', height)
        this.$codable.css('height', height)
        if (this.$codable.data('cmeditor')) {
          this.$codable.data('cmeditor').setsize(null, height)
        }
      },
      onClose () {
        ipc.send('detail-win-close')
      },
      onFullScreen () {
        this.fullscreen = !this.fullscreen
        ipc.send('detail-win-full', this.fullscreen)
      },
      onMinScreen () {
        ipc.send('detail-win-min')
      },
      onEditorBlur (quill) {
        // console.log('editor blur!', quill)
      },
      onEditorFocus (quill) {
        // console.log('editor focus!', quill)
      },
      onEditorReady (quill) {
        console.log('editor ready!', quill)
      },
      onEditorChange ({quill, html, text}) {
        this.$set(this.currItem, 'dirty', true)
        this.currItem.content = html
        this.currItem.plainContent = text.replace('\n', ' ')
        this.delaySave()
      },
      close (index) {
        const removeItem = this.list[index]
        this.list.splice(index, 1)
        if (removeItem.id !== this.currItem.id) {
          return
        }
        // 当前选中，且是最后一个元素
        let nextIndex = index
        if (index > this.list.length - 1) {
          nextIndex = index - 1
        }
        this.$nextTick(() => {
          this.currItem = this.list[nextIndex]
        })
      },
      alert () {
        console.log(11)
      },
      onSelect (index, indexPath) {
        // this.active = index
        this.currItem = this.list.find(i => i.id === index)
        console.log('index', index, 'indexPath', indexPath)
      },
      save () {
        const form = {}
        form.id = this.currItem.id
        form.name = this.currItem.name
        form.type = this.currItem.type
        form._id = this.currItem._id
        form.content = this.currItem.content
        form.createdTime = this.currItem.createdTime
        form.plainContent = this.currItem.plainContent
        form.summary = this.currItem.plainContent && this.currItem.plainContent.substring(0, 80)
        form.modifiedTime = new Date()
        form.tags = this.currItem.tags
        if (this.currItem.tags && this.currItem.tags.length > 0) {
          this.currItem.tags.forEach(t => {
            tagInsertApi({ name: t })
          })
        }
        if (this.currItem.action === 'add') {
          form.createdTime = new Date()
          insertApi(form).then(r => {
            r.action = 'edit'
            r.type = this.currItem.type
            Object.assign(this.currItem, r)
            this.$set(this.currItem, 'dirty', false)
            ipc.send('list-refresh', this.currItem)
          })
          return
        }
        updateApi(form).then(r => {
          this.$set(this.currItem, 'dirty', false)
          ipc.send('list-refresh', this.currItem)
        })
      },
      delaySave () {
        if (this.timeout) {
          clearTimeout(this.timeout)
        }
        this.timeout = setTimeout(() => {
          this.saveHistory()
        }, 1000 * 5)
      },
      saveHistory () {
        if (!this.currItem.id) {
          return
        }
        const key = 'favorite_' + this.currItem.id
        let history = []
        if (localStorage[key]) {
          history = JSON.parse(localStorage[key])
        }
        let point = {}
        point.content = this.currItem.content
        point.id = new Date().getTime()
        history.push(point)
        localStorage[key] = JSON.stringify(history)
      }
    },
    computed: {
      active () {
        return this.currItem.id
      }
    }
  }
</script>
<style lang="scss">
    .detail-win {
        &.open-side-menu {
            .main-panel {
                width: -webkit-calc(100% - 200px);
                .top-bar{
                    border-radius: 0 6px 0 0;
                }
            }
            .side-menu {
                width: 200px;
            }
        }
        width: 100%;
        font-size: 12px;
        box-shadow: 0 0 5px rgba(0, 0, 0, 1);
        border-radius: 4px;
        /*margin: 5px;*/
        background-color: white;
        position: absolute;
        .side-menu {
            display: inline-block;
            transition:width 0.5s;
            width: 0;
            border-radius: 6px 0 0 0;
            border-right: 1px solid #a9a9a9;
            /*border-right: 1px solid #ccc;*/
            overflow-y: auto;
            .el-menu-item {
                .el-icon-close {
                    margin-right: 0;
                }
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                height: 35px;
                line-height: 35px;
                padding: 0;
                &.is-active {
                    background-color: wheat;
                }
                &:hover {
                    button{
                        display: unset;
                    }
                }
                font-size: 12px;
                button{
                    display: none;
                }
            }
            &::-webkit-scrollbar {/*滚动条整体样式*/
                width: 8px;     /*高宽分别对应横竖滚动条的尺寸*/
                height: 1px;
            }

            &::-webkit-scrollbar-thumb {/*滚动条里面小方块*/
                border-radius: 10px;
                -webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
                background: #535353;
            }
            &::-webkit-scrollbar-track {/*滚动条里面轨道*/
                -webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
                border-radius: 10px;
                background: #EDEDED;
            }
            /*& + div.main-panel {
                width:-webkit-calc(100% - 200px)
            }*/
        }
        .main-panel{
            transition:width 0.5s;
            display: inline-block;
            position: absolute;
            width: inherit;
            background-color: white;
            border-radius: 6px 6px 0 0;
            height: 100%;
            .header-panel {
                position: relative;
                .header-row {
                    position: relative;
                    height: 30px;
                    line-height: 30px;
                    margin: 5px 5px;
                }
            }
            .note-editor.note-frame {
                border: none;
                .note-statusbar.locked {
                    display: none;
                }
            }
            .ql-editor{
                &::-webkit-scrollbar {/*滚动条整体样式*/
                    width: 8px;     /*高宽分别对应横竖滚动条的尺寸*/
                    height: 1px;
                }

                &::-webkit-scrollbar-thumb {/*滚动条里面小方块*/
                    border-radius: 10px;
                    -webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
                    background: #535353;
                }
                &::-webkit-scrollbar-track {/*滚动条里面轨道*/
                    -webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
                    border-radius: 10px;
                    background: #EDEDED;
                }
            }
            .top-bar {
                -webkit-user-select: none;
                -webkit-app-region: drag;
                border-radius: 6px 6px 0 0;
                text-align: right;
                padding-right: 5px;
                background-color: lightgrey;
                .el-button {
                    color: white;
                    -webkit-app-region: no-drag;
                }
                .dirty {
                    color: red;
                    position: absolute;
                    left: 10px;
                    top: 10px;
                }
            }
        }
        .current{
            background-color: lightgray;
        }
    }


    /*.ql-editor{
        height:400px;
    }*/
</style>
