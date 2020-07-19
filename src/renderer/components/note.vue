<template>
    <div class="favorite-tab">
        <div class="search">
            <el-input v-model="search.keyword" size="mini"  @keyup.enter.native='doSearch'>
                <el-button slot="append" type="text" icon="el-icon-plus" @click="add" circle></el-button>
                <el-select v-model="search.tag" slot="prepend" placeholder="分类" class="tag" filterable clearable >
                    <el-option v-for="item in tags"
                               :key="item.name"
                               :label="item.name"
                               :value="item.name">
                    </el-option>
                </el-select>
            </el-input>
        </div>
        <div class="content scrollbar">
            <template v-for="(row, index) in list" >
                <div @contextmenu.prevent="showRightMenu(row)" class="row-span" :class="{ 'row-selected': selected===row.id}">
                    <a @click="detail(row)"
                       href="javascript:void(0);">
                        <div class="title" v-html="row.name"></div>
                        <div class="summary" v-html="row.summary"></div>
                        <div class="tag">
                            <el-tag v-for="tag in row.tags" :key="tag" size="mini" type="success" effect="dark" @click.stop="selectTag(tag)" >
                                {{tag}}
                            </el-tag>
                        </div>
                        <span class="time">
                            {{row.modifiedTime | modifiedTime}}
                        </span>
                        <i class="el-icon-s-flag"  :class="{'flag-active': row.flag}" @click.stop="onFlag(row)"></i>
                    </a>
                </div>
            </template>
        </div>
    </div>
</template>

<script>
  import { search as searchApi, del as delApi, flag as flagApi } from '@/api/blog'
  import { getAll as tagAllApi } from '@/api/tag'
  const uuid = require('node-uuid')

  const {ipcRenderer} = require('electron')
  const ipc = require('electron').ipcRenderer

  export default {
    name: 'Favorite',
    data () {
      return {
        selected: undefined,
        list: [],
        tags: [],
        search: {
          keyword: undefined,
          tag: undefined
        },
        delaySearchTime: undefined
      }
    },
    watch: {
      search: {
        handler: function () {
          this.delaySearch()
        },
        deep: true
      }
    },
    filters: {
      modifiedTime (v) {
        const now = new Date()
        if (now.getFullYear() !== v.getFullYear()) {
          return v.format('yyyy-MM-dd')
        }
        if (now.getMonth() !== v.getMonth()) {
          return v.format('MM-dd')
        }
        // 同年月日，显示时间
        if (now.getDate() === v.getDate()) {
          return v.format('hh:mm:ss')
        }
        const duration = now.getDate() - v.getDate()
        if (duration === 1) {
          return '昨天'
        }
        if (duration === 2) {
          return '前天'
        }
        const lastWeekEnd = now.getDate() - now.getDay()
        if (v.getDate() <= lastWeekEnd && v.getDate() > lastWeekEnd - 7) {
          return '上周'
        }
        return v.format('MM-dd')
      }
    },
    created () {
      this.Init()
    },
    mounted () {
      ipcRenderer.on('list-favorite-right-menu', (e, data) => {
        const selectedRow = this.list.find(row => row.id === data.id)
        if (data.action === 'del') {
          delApi(selectedRow).then(r => {
            this.list = this.list.filter(row => row.id !== data.id)
          })
        }
      })
    },
    methods: {
      Init () {
        tagAllApi().then(r => {
          this.tags = r
          this.doSearch()
        })
      },
      delaySearch () {
        if (this.delaySearchTime) {
          clearTimeout(this.delaySearchTime)
        }
        this.delaySearchTime = setTimeout(this.doSearch, 200)
      },
      doSearch () {
        searchApi(this.search).then(r => {
          this.list = r
          console.log('this.list', r)
        })
      },
      onFlag (row) {
        this.$set(row, 'flag', !row.flag)
        flagApi(row).then(r => {
          this.Init()
        })
      },
      selectTag (tag) {
        this.search.tag = tag
      },
      detail (row) {
        const cmd = {
          action: 'view',
          type: 'favorite',
          data: row
        }
        this.selected = row.id
        ipc.send('open-detail', cmd)
      },
      showRightMenu (row) {
        ipc.send('right-menu', {type: 'favorite', id: row.id, flag: row.flag})
      },
      add () {
        const cmd = {
          action: 'add',
          type: 'favorite',
          data: {
            id: uuid.v1().replace('-', ''),
            type: 'favorite',
            tags: [],
            name: '新增'
          }
        }
        ipc.send('open-detail', cmd)
      }
    }
  }
</script>
<style lang="scss">
    .el-select-dropdown__item {
        font-size: 12px;
    }
    .favorite-tab {
        .el-input-group > .el-input__inner {
            border-radius: unset;
            padding: 0 0 0 2px
        }
        .el-input__inner {
            padding: 0 5px;
            vertical-align: middle;
        }
        .el-input-group__append {
            border-radius: unset;
        }
        .el-input-group__prepend {
            border-radius: unset;
        }

        .search{
            .el-select .el-input {
                width: 80px;
            }
        }
        .content {
            .el-tag + .el-tag{
                margin-left: 5px;
            }
        }
    }
</style>
<style lang="scss" scoped>
    .content {
        overflow-y: auto;
        max-height: 600px;
        margin-top: 5px;
    }
    .search {
        position: relative;
        width: 100%;
    }
    .row-span{
        -webkit-transition:background-color 0.3s linear;
        -moz-transition:background-color 0.3s linear;
        -o-transition:background-color 0.3s linear;
        transition:background-color 0.3s linear;
        &.row-selected{
            background: antiquewhite !important;
        }
        position: relative;
        font-family: SimSun;
        /* &:nth-child(even)
         {
             background:ghostwhite;
             a {
                 color: gray;
             }
         }*/
        &:hover {
            background-color: #F2F6FC;
            color: #909399;
            i.el-icon-s-flag{
                color: unset;
            }
        }
        .summary {
            color: #909399;
        }
        .title {
            font-size: 14px;
        }
        a {
            min-height: 50px;
            color: #606266;
            text-decoration: none;
            display: inline-block;
            line-height: 20px;
            width: 220px;
            padding: 5px 10px;
        }
        i.el-icon-s-flag{
            position: absolute;
            right: 10px;
            top: 30px;
            color: white;
            cursor: pointer;
            &:hover{
                font-size: 14px;
            }
            &.flag-active {
                color: red;
            }
        }
        .el-tag--mini {
            font-family: FangSong;
            padding: 0 4px;
            font-size: 10px;
            height: 16px;
            line-height: 14px;
        }
        .tag {
            .el-tag {
                cursor: pointer;
                &:hover {
                    background-color: #409eff;
                    border-color: #409eff;
                    color: #fff;
                }
            }
        }
        .time {
            color: #909399;
            position: absolute;
            right: 10px;
            top: 8px;
        }
    }

</style>
