<template>
    <div class="favorite">
        <div class="search" v-if="!isEdit">
            <el-input v-model="keyword" size="mini"  @keyup.enter.native='doSearch'>
                <el-button slot="append" type="text" icon="el-icon-plus" @click="onAdd" circle></el-button>
            </el-input>
        </div>
        <div v-if="isEdit" style="padding: 5px" class="edit-panel">
            <div class="item">
                <label>名称</label><el-input v-model="edit.text" size="mini"></el-input>
            </div>
            <div class="item">
                <label>类型</label>
                <el-select v-model="edit.type"  size="mini"  filterable :disabled="!!edit._id">
                    <el-option label="文件" value="leaf"></el-option>
                    <el-option label="文件夹" value="dir"></el-option>
                </el-select>
            </div>
            <template v-if="edit.type === 'leaf'">
                <div class="item">
                    <label>URL</label>
                    <el-input v-model="edit.url" size="mini" type="textarea"  :rows="4" @input="onURL"></el-input>
                </div>
                <div class="item">
                    <label>打开方式</label>
                    <el-select v-model="edit.exec"  size="mini"  filterable clearable >
                        <el-option label="默认" value="default"></el-option>
                        <el-option label="浏览器" value="chrome"></el-option>
                        <el-option label="本地文件" value="explorer"></el-option>
                        <el-option label="自定义" value="custom"></el-option>
                    </el-select>
                </div>
                <div class="item" v-if="edit.exec === 'custom'">
                    <label>指令</label>
                    <el-input v-model="edit.command" size="mini"></el-input>
                </div>
            </template>
            <div>
                <el-button size="mini" type="primary" @click="onSave">保存</el-button>
                <el-button size="mini" @click="isEdit=false">取消</el-button>
            </div>
        </div>
        <v-jstree v-else :data="treeData" allow-batch whole-row :item-events="itemEvents" @item-drag-end="onDragEnd">
            <template slot-scope="_">
                <div style="display: inherit; width: 200px" @click.ctrl="customItemClickWithCtrl" @click.exact="customItemClick(_.vm, _.model, $event)" :class="{'match': _.model.match}">
                    <i :class="_.vm.themeIconClasses" role="presentation" v-if="!_.model.loading"></i>
                    {{_.model.text}}
                    <span class="item-menu">
                        <a href="javascript:void(0)" @click.stop="onAdd(_.model)" v-if="_.model.type !== 'leaf'">
                            <i class="el-icon-plus"></i>
                        </a>
                        <a href="javascript:void(0)" @click.stop="onEdit(_.model)">
                            <i class="el-icon-edit"></i>
                        </a>
                        <a href="javascript:void(0)" @click.stop="onDel(_.model)">
                            <i class="el-icon-delete"></i>
                        </a>
                    </span>
                </div>
            </template>
        </v-jstree>
    </div>
</template>

<script>
  import VJstree from 'vue-jstree'
  import { insert as insertApi, update as updateApi, getAll as getAllApi, del as delApi, get as getApi } from '@/api/favorite'
  // const shell = require('electron').shell
  const exec = require('child_process').exec
  const newData = () => {
    return {
      parentId: undefined,
      parentText: undefined,
      text: undefined,
      url: undefined,
      exec: 'default',
      type: 'leaf',
      opened: true
    }
  }
  export default {
    name: 'Favorite',
    components: {
      VJstree
    },
    data () {
      return {
        edit: newData(),
        isEdit: false,
        keyword: undefined,
        itemEvents: {
          contextmenu: function () {
            console.log(arguments[2])
            arguments[2].preventDefault()
            console.log('contextmenu')
          }
        },
        treeData: []
      }
    },
    created () {
      this.load()
    },
    methods: {
      onURL (val) {
        // http 开头
        if (val.indexOf('http') === 0) {
          this.edit.exec = 'chrome'
        }
      },
      onDragEnd (node, item, e) {
        console.log(this.treeData)
      },
      load () {
        getAllApi().then(r => {
          this.org(r || [])
        })
      },
      org (data) { // 组织数据
        const treeData = []
        data.forEach(d => {
          this.iconMap(d)
          if (!d.parentId) {
            treeData.push(d)
            return
          }
          const parent = data.find(r => r._id === d.parentId)
          parent.children = parent.children || []
          d.parent = parent
          parent.children.push(d)
        })
        this.treeData = treeData
      },
      iconMap (d) {
        if (d.type !== 'leaf') {
          d.icon = 'el-icon-folder'
        } else if (d.exec === 'chrome') {
          d.icon = 'el-icon-link'
        } else if (d.exec === 'explorer') {
          d.icon = 'el-icon-folder'
        } else {
          d.icon = 'el-icon-video-play'
        }
      },
      onAdd (parent) {
        this.edit = newData()
        this.edit.parentId = parent._id
        this.isEdit = true
      },
      onDel (node) {
        this.doDel(node)
        this.load()
      },
      doDel (node) {
        const children = node.children || []
        children.forEach(d => {
          this.doDel(d)
        })
        delApi(node)
      },
      onSave () {
        if (this.edit.type === 'leaf') {
          this.edit.isLeaf = true
          this.edit.icon = 'el-icon-caret-right'
        } else {
          this.edit.isLeaf = false
          this.edit.icon = undefined
        }
        if (this.edit._id) {
          updateApi(this.edit).then(r => {
            this.isEdit = false
            this.load()
          })
        } else {
          insertApi(this.edit).then(r => {
            this.isEdit = false
            this.load()
          })
        }
      },
      onEdit (node) {
        getApi(node._id).then(r => {
          this.edit = r
          this.isEdit = true
        })
      },
      doSearch () {
        this.doMatch(this.treeData)
      },
      doMatch (nodes) {
        const _this = this
        nodes = nodes || []
        nodes.forEach(n => {
          if (n.text && _this.keyword && n.text.toLowerCase().indexOf(_this.keyword.toLowerCase()) !== -1) {
            this.open(n)
            this.$set(n, 'match', true)
          } else {
            this.$set(n, 'match', false)
          }
          this.doMatch(n.children)
        })
      },
      open (n) {
        n && this.$set(n, 'opened', true)
        n.parent && this.open(n.parent)
      },
      customItemClick (event, node) {
        if (node.type !== 'leaf' || node.loading) {
          return
        }
        let _exec = node.exec
        let command
        if (_exec === 'default') {
          command = node.url
        } else if (_exec === 'custom') {
          command = 'start ' + node.command + ' ' + node.url
        } else if (_exec) {
          command = 'start ' + _exec + ' ' + node.url
        }
        if (!command) {
          return
        }
        this.$set(node, 'loading', true)
        exec(command, {}, err => {
          console.log(err)
          this.$set(node, 'loading', false)
        }).unref()
      }
    }
  }
</script>
<style lang="scss">
    .el-select-dropdown__item {
        font-size: 12px;
    }
    .favorite {
        .match {
            background: #e6a23c;
        }
        .item-menu {
            a{
                display: inline-block;
                padding: 0 5px;
                vertical-align: middle;
            }
            position: absolute;
            right: 10px;
            display: none;
        }
        /*.tree-selected{
            background-color: #e1e1e1 !important;
        }*/
        .tree-hovered{
            background-color: #eee !important;
            .item-menu {
                display: unset;
            }
        }
        .edit-panel {
            .item {
                label{
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                }
                margin: 15px 0;
            }
        }
        .el-input-group > .el-input__inner {
            border-radius: unset;
            padding: 0 0 0 2px
        }
        .el-input__inner , .el-textarea__inner{
            padding: 0 5px;
            vertical-align: middle;
        }
        .el-input-group__append {
            border-radius: unset;
        }
        .search{
            .el-select .el-input {
                width: 80px;
            }
        }
    }
</style>
