<template>
  <div class="itart-main"
       :style="{ background: 'url(' + bg + ')', backgroundSize: '290px 100px', backgroundRepeat: 'no-repeat', backgroundColor: 'white', backgroundOrigin: 'border-box'}">
    <div class="main-top-bar ">
      <el-button size="mini" type="text" icon="el-icon-minus" @click="onMin"></el-button>
      <el-button size="mini" type="text" icon="el-icon-close" @click="onClose"></el-button>
    </div>
    <div class="main-content ">
      <el-tabs v-model="activeName" @tab-click="handleClick" class="art-tabs">
        <el-tab-pane :name="c.id" v-for="c in coms" :key="c.id" :lazy="true">
          <span slot="label">{{c.name}}</span>
          <component :is="c.com" ref="comRef"></component>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script>
  import Note from './note'
  import Favorite from './favorite'

  const {ipcRenderer} = require('electron')

  export default {
    name: 'main-page',
    components: {Note, Favorite},
    data () {
      // {id: 'post', name: 'Post', com: Post},
      // {id: 'task', name: 'Task', com: Task},
      this.coms = [{
        id: 'note',
        name: '虾记',
        com: Note
      }, {
        id: 'favorite',
        name: '收藏',
        com: Favorite
      }]
      return {
        bg: 'static/image/bg.png',
        activeName: 'note'
      }
    },
    methods: {
      onClose () {
        ipcRenderer.send('main-win-close')
      },
      onMin () {
        ipcRenderer.send('main-win-min')
      },
      handleClick (tab, event) {
        console.log(tab, event)
      },
      open (link) {
        this.$electron.shell.openExternal(link)
      }
    },
    mounted () {
      ipcRenderer.on('list-refresh', (e, data) => {
        this.$refs['comRef'][0].Init()
      })
    }
  }
</script>
<style lang="scss">
  .itart-main {
    box-shadow: 0 0 5px rgba(0, 0, 0, 1);
    border-radius: 4px;
    font-size: 12px;
    margin: 5px;
    position: absolute;
    background-color: white;
    width: 290px;
    height: 690px;
    .el-tabs__header {
        -webkit-app-region: drag;
      font-size: 12px;
      padding: 0 5px;
      .el-tabs__active-bar {
        background-color: sienna
      }
      .el-tabs__item {
          font-weight: bold;
          font-family: KaiTi;
          -webkit-app-region: no-drag;
          font-size: 16px;
        &.is-active {
          color: sienna;
        }
      }
    }

    .main-content {
      height: -webkit-calc(100% - 32px);
      .el-tabs {
        height: 100%;
      }
      .el-tabs__content {
        height: -webkit-calc(100% - 55px);
        background-color: white;
      }
    }
    .main-top-bar {
      -webkit-user-select: none;
      -webkit-app-region: drag;
      text-align: right;
      padding: 0 8px;
      border-top-right-radius: 4px;
      border-top-left-radius: 4px;
      .el-button {
        -webkit-app-region: no-drag;
      }
    }
    .el-button {
      font-size: 12px;
    }

    .scrollbar::-webkit-scrollbar {/*滚动条整体样式*/
      width: 8px;     /*高宽分别对应横竖滚动条的尺寸*/
      height: 1px;
    }
    .scrollbar{
      &::-webkit-scrollbar-thumb {/*滚动条里面小方块*/
        border-radius: 10px;
        -webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
        background: palegoldenrod;
      }

      &::-webkit-scrollbar-track {/*滚动条里面轨道*/
        -webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
        border-radius: 10px;
        background: white;
      }
      &:hover{
        &::-webkit-scrollbar-track{
          -webkit-box-shadow:inset 0 0 6px rgba(0,0,0,0.3);
          background-color:#F5F5F5;
        }
        &::-webkit-scrollbar-thumb{
          border-radius:10px;
          -webkit-box-shadow:inset 0 0 6px rgba(0,0,0,.3);
          background-color: rgba(0, 0, 0, 0.45);
        }
      }
    }
  }
</style>
