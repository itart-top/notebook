<template>
    <div>
        <div class="post-panel">
            <md-field md-inline class="search">
                <md-input v-model="searchword"></md-input>
            </md-field>
            <v-tree ref='tree' :data='treeData1' :draggable=true :tpl='tpl' class="content-tree"/>
        </div>
    </div>
</template>

<script>
  export default {
    name: 'HelloWorld',
    data () {
      return {
        searchword: '',
        initSelected: ['node-1'],
        treeData1: [{
          title: 'node1',
          showToolbar: false,
          expanded: true,
          children: [{
            title: 'node 1-1',
            expanded: true,
            showToolbar: false,
            children: [{
              title: 'node 1-1-1',
              showToolbar: false
            }, {
              title: 'node 1-1-2',
              showToolbar: false
            }, {
              title: 'node 1-1-3',
              showToolbar: false
            }]
          }, {
            title: 'node 1-2',
            showToolbar: false,
            children: [{
              title: "<span style='color: red'>node 1-2-1</span>",
              showToolbar: false
            }, {
              title: "<span style='color: red'>node 1-2-2</span>",
              showToolbar: false
            }]
          }]
        }],
        treeData2: [{
          title: 'node1',
          expanded: false,
          showToolbar: false,
          async: true
        }],

        treeData3: [{
          title: 'node1',
          expanded: true,
          showToolbar: false,
          children: [{
            title: 'node 1-1',
            expanded: true,
            showToolbar: false,
            children: [{
              title: 'node 1-1-1',
              showToolbar: false
            }, {
              title: 'node 1-1-2',
              showToolbar: false
            }, {
              title: 'node 1-1-3',
              showToolbar: false
            }]
          }]
        }]
      }
    },
    methods: {
      // tpl (node, ctx, parent, index, props) {
      tpl (...args) {
        let {0: node, 2: parent, 3: index} = args
        let titleClass = node.selected ? 'node-title node-selected' : 'node-title'
        if (node.searched) titleClass += ' node-searched'
        let toolbar = ''
        if (node.showToolbar) {
          toolbar = (<span class='node-add'>
            <md-button class='md-icon-button  md-raised md-primary' onClick={() => this.$refs.tree.addNode(node, {title: 'sync node'})}>+</md-button>
            <md-button class='md-icon-button  md-raised md-primary' onClick={() => this.$refs.tree.addNode(node, {title: 'sync node'})}>E</md-button>
            <md-button class='md-icon-button  md-raised md-primary' onClick={() => this.$refs.tree.delNode(node, parent, index)}>-</md-button>
          </span>)
        }
        return <span class='node-label' onMouseover={() => this.showToolbar(node, true) } onMouseout ={() => { this.showToolbar(node, false) }} >
          <span class={titleClass} domPropsInnerHTML={node.title} onClick={() => {
            this.$refs.tree.nodeSelected(node)
          }}></span>
          {toolbar}
        </span>
      },
      async asyncLoad (node) {
        this.$set(node, 'loading', true)
        let pro = new Promise(resolve => {
          setTimeout(resolve, 2000, ['async node1', 'async node2'])
        })
        this.$refs.tree1.addNodes(node, await pro)
        this.$set(node, 'loading', false)
      },
      search () {
        this.$refs.tree.searchNodes(this.searchword)
      },
      showToolbar (node, show) {
        setTimeout(() => {
          node.showToolbar = show
        }, 200)
      },
      onMouseOver () {
        console.log(11)
      }
    }
  }
</script>
<style lang="scss">
    .post-panel {
        .content-tree {
            ul {
                padding-top: 0 !important;
            }
            li {
                padding: 6px 0 0 0 !important;;
            }
        }
    }
</style>
<style lang="scss" scoped>
    .search {
        margin: 0;
    }
    .content-tree {
        padding: 0;
        margin: 0;
    }

    .node-label {
        display: inline-block;
    }
    .node-add{
        button {
            width: 18px;
            min-width: 18px;
            height: 18px;
        }
    }
</style>
