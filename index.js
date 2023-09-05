// import {createServer} from 'http'
const fs = require('fs')
const { createServer } = require('http')
const { handleApi } = require('./private/api.js')

const server = createServer()
const port = 2345

const provideLink = () => {
  const serverLink = 'Server working at' + ': ' + 'http://' + 'localhost' + ':' + port
  console.log(serverLink)
}

// Запуск сервера
server.listen(port, provideLink)


server.addListener('request', (request, response) => {
  if (request.url.startsWith('/api/')) {
    handleApi(request, response)
  } else {
    const path = './public/' + (request.url.replace(/^.|\?.*/g, '') || 'index.html')

    fs.readFile(path, (err, fileContent) => {
      if (err) {
        console.error(err)
        response.end('file not found')
      }
      else {
        if (path.endsWith('.svg')) response.setHeader('content-type', 'image/svg+xml')
        response.end(fileContent)
      }
    })
  }
})


