import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      meta: {requiresAuth: true},
      name: 'MainScreen',
      component: require('@/components/home').default,
      children: [
        {
          path: '/components/task',
          meta: {requiresAuth: true},
          name: 'ProjectDetails',
          component: require('@/components/task').default
        },
        {
          path: '/components/post',
          meta: {requiresAuth: true},
          name: 'ConstructionInvestment',
          component: require('@/components/post').default
        },
        {
          path: '/components/favorite',
          meta: {requiresAuth: true},
          name: 'ConstructionInvestment',
          component: require('@/components/favorite').default
        }
      ]
    },
    {
      path: '/detail',
      name: 'detail',
      component: require('@/components/detail').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
