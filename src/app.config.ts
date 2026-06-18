export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/schedule/index',
    'pages/approval/index',
    'pages/mine/index',
    'pages/appointment-detail/index',
    'pages/create-appointment/index',
    'pages/approval-detail/index',
    'pages/dashboard/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1890ff',
    navigationBarTitleText: '医美预约管理',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#86909c',
    selectedColor: '#1890ff',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/schedule/index',
        text: '排期'
      },
      {
        pagePath: 'pages/approval/index',
        text: '审批'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
