1 || require('../index.js')
module.exports = { handleApi }

const fs = require('fs')

//read credentials on start
const credsPath = './private/data/credentials.json'
let credentials
fs.readFile(credsPath, 'utf-8', (err, fileContent) => credentials = JSON.parse(fileContent))

// read tokens on start
const sessionsPath = './private/data/sessions.json'
let sessions
fs.readFile(sessionsPath, 'utf-8', (err, fileContent) => sessions = JSON.parse(fileContent))

// read taskLists on start
const listsPath = './private/data/lists.json'
let taskLists
fs.readFile(listsPath, 'utf-8', (err, fileContent) => taskLists = JSON.parse(fileContent))

// lists ID
let lastId = +fs.readFileSync('private/data/lastId', 'utf-8')

// read tasks
const tasksPath = './private/data/tasks.json'
let tasks
fs.readFile(tasksPath, 'utf-8', (err, fileContent) => tasks = JSON.parse(fileContent))

async function getBody(request) {
  let body = ''
  for await (const chunk of request) body += chunk

  try {
    return JSON.parse(body)
  } catch (error) {
    return body
  }
}

function genId() {
  ++lastId
  fs.writeFileSync('private/data/lastId', lastId.toString())
  return lastId
}

function genToken() {
  const abc = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 30; i++) {
    let index = Math.floor(Math.random() * 36)
    if (i % 6 === 0 && i !== 0) token += '-'
    token += abc[index]
  }
  return token
}

async function handleApi(request, response) {
  const route = request.url.slice(5)
  const cookie = request.headers.cookie || ""
  const method = request.method

  if (route === 'checkauth') {
    const { token } = Object.fromEntries(cookie.split('; ').map(c => c.split('=')))

    if (sessions.some(session => session.token === token)) {
      response.end('ok')
    } else {
      response.statusCode = 401
      response.end(`<script>alert('You are not Authorized!')</script>`)
    }
  }

  if (route === 'register') {
    const { login, password } = await getBody(request)

    if (login && password) {
      credentials.push({ login, password })
      fs.writeFile(credsPath, JSON.stringify(credentials, null, 2), () => {
        response.end('you have been registered')
      })
    } else {
      response.statusCode = 400
      response.end(`<script>console.log('Registration goes wrong! Try again later!')</script>`)
    }

  }

  if (route === 'login') {
    const { login, password } = await getBody(request)

    if (credentials.some(user => user.login === login && user.password === password)) {
      const token = genToken()
      sessions.push({ login, token, expireDate: Date.now() + 26e8 })
      fs.writeFile(sessionsPath, JSON.stringify(sessions, null, 2), (err) => {
        response.setHeader('Set-Cookie', `token=${token}; Path=/; Max-Age=${26e5}`)
        response.end('ok')
      })
    } else {
      response.statusCode = 401
      response.end(`<script>alert('Login or password does not match!')</script>`)
    }
  }

  if (route === 'logout') {
    const { token } = Object.fromEntries(cookie.split('; ').map(c => c.split('=')))
    const i = sessions.findIndex(session => session.token === token)

    if (i != -1) sessions.splice(i, 1)
    fs.writeFile(sessionsPath, JSON.stringify(sessions, null, 2), (err) => {
      response.setHeader('Set-Cookie', `token=; Path=/; Max-Age=0`)
      response.end('ok')
    })
  }

  if (route === 'tasklists') {
    const { token } = Object.fromEntries(cookie.split('; ').map(c => c.split('=')))
    const session = sessions.find(session => session.token === token)
    if (!session) {
      response.statusCode = 401
      response.end(`<script>alert('You are not Authorized!')</script>`)
    } else {
      const user = session.login
      const userTaskLists = taskLists.find(item => item.user === user).lists

      response.end(JSON.stringify(userTaskLists))
    }
  }

  if (route === 'tasklist') {
    const { token } = Object.fromEntries(cookie.split('; ').map(c => c.split('=')))
    const session = sessions.find(session => session.token === token)
    if (!session) {
      response.statusCode = 401
      response.end(`<script>alert('You are not Authorized!')</script>`)
    } else {
      const user = session.login
      const { name, date, avatar } = await getBody(request)
      const id = genId()

      const userObj = taskLists.find(item => item.user === user)
      if (!name || !date) {
        response.end(`<script>alert('Not enough parameters to Create a List!')</script>`)
      } else {
        userObj.lists.push({ id, name, date, avatar })
        console.log(taskLists)
        console.log(userObj)
        fs.writeFile(listsPath, JSON.stringify(taskLists, null, 2), () => {
          response.end('you have been Create a new list of things to do')
        })
        response.end(JSON.stringify(taskLists))
      }
    }

  }

  if (route.startsWith('tasks/')) {
    const { token } = Object.fromEntries(cookie.split('; ').map(c => c.split('=')))
    const session = sessions.find(session => session.token === token)
    if (!session) {
      response.statusCode = 401
      response.end(`<script>alert('You are not Authorized!')</script>`)
    } else {
      const user = session.login
      const id = +route.slice(6)
      if (taskLists.some(item => item.user === user && item.lists.some(item => item.id === id))) {
        const listTasks = tasks.filter(item => item.listId === id)

        response.end(JSON.stringify(listTasks))
      } else {
        response.statusCode = 401
        response.end(`<script>alert('You are not Authorized!')</script>`)
      }
    }
  }

  if (route === 'task' && method === 'POST') {
    const { token } = Object.fromEntries(cookie.split('; ').map(c => c.split('=')))
    const session = sessions.find(session => session.token === token)

    if (!session) {
      response.statusCode = 401
      response.end(`<script>alert('You are not Authorized!')</script>`)
    } else {
      const user = session.login
      const { name, note, listId } = await getBody(request)
      const id = genId()

      if (taskLists.some(item => item.user === user && item.lists.some(item => item.id === listId))) {
        if (!name) {
          response.statusCode = 400
          response.end(`<script>alert('Name can not be empty')</script>`)
        } else {
          tasks.push({ id, listId, name, note, done: false })
          fs.writeFile(tasksPath, JSON.stringify(tasks, null, 2), () => {
            response.end('You have created a new task to do')
          })
        }
      } else {
        response.statusCode = 401
        response.end(`<script>alert('You are not Authorized!')</script>`)
      }
    }
  }

  if (route === 'task' && method === 'DELETE') {
    const { token } = Object.fromEntries(cookie.split('; ').map(c => c.split('=')))
    const session = sessions.find(session => session.token === token)

    if (!session) {
      response.statusCode = 401
      response.end(`<script>alert('You are not Authorized!')</script>`)
    } else {
      const user = session.login
      const { id, listId } = await getBody(request)

      if (!taskLists.some(item => item.user === user && item.lists.some(item => item.id === listId))) {
        response.statusCode = 401
        response.end(`<script>alert('You are not allowed to do this!')</script>`)
      } else {
        const i = tasks.findIndex(t => t.listId === listId && t.id === id)
        tasks.splice(i, 1)
        fs.writeFile(tasksPath, JSON.stringify(tasks, null, 2), () => {
          response.end('You have deleted selected task to do')
        })
      }
    }
  }

  if (route === 'task' && method === 'PUT') {
    const { token } = Object.fromEntries(cookie.split('; ').map(c => c.split('=')))
    const session = sessions.find(session => session.token === token)

    if (!session) {
      response.statusCode = 401
      response.end(`<script>alert('You are not Authorized!')</script>`)
    } else {
      const user = session.login
      const { id, listId, note, name, done } = await getBody(request)

      if (!taskLists.some(item => item.user === user && item.lists.some(list => list.id === listId))) {
        response.statusCode = 401
        response.end(`<script>alert('You are not allowed to do this!')</script>`)
      } else {
        const task = tasks.find(t => t.listId === listId && t.id === id)
        if (!task) {
          response.statusCode = 401
          response.end(`<script>alert('Task not found!')</script>`)
        } else {
          
          if (done !== undefined) task.done = done
          if (name !== undefined) task.name = name
          if (note !== undefined) task.note = note
          
          fs.writeFile(tasksPath, JSON.stringify(tasks, null, 2), () => {
            response.end('You have edited selected task to do')
          })
        }
      }
    }
  }
}






