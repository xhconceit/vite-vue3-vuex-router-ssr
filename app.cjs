const fs = require('fs')
const path = require('path')
const express = require('express')

async function createServer() {
  const app = express()
  const serveStatic = require('serve-static')


  // 测试接口
  app.use('/api', (req, res) => {
    res.json({
      count: Math.floor(Math.random() * 100)
    })
  })

  // 开始静态资源服务 关闭 index 页面默认
  app.use(serveStatic(path.resolve(__dirname, 'dist/client'), { index: false }))
  app.use('*', async (req, res) => {
    const url = req.originalUrl
    try {
      // 1. 读取 index.html 模版
      template = fs.readFileSync(
        path.resolve(__dirname, 'dist/client/index.html'),
        'utf-8'
      )
      
      // 2. 加载服务端渲染页面方法
      const render = (await import('./dist/server/entry-server.js')).render

      // 3. 渲染 html 页面
      const { appHtml, state } = await render(url)

      // 4. 注入渲染后的应用程序 HTML 到模板中。
      const html = template.replace(`<!--ssr-outlet-->`, appHtml)
        // 将 state 数据转成 json 后插入到 html 中
        .replace('\'<!--vuex-state-->\'', JSON.stringify(state))

        // 5. 返回渲染后的 HTML。
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)

    } catch (error) {
      console.log(error);
      res.status(404).set({'Content-Type': 'text/html; charset=utf-8'}).end(`SSR 渲染错误: ${error}`)
    }
  })

  app.listen(3000)
}

createServer()