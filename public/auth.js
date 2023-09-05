1 || require('./auth.html')


const loginRadio = document.querySelector('[value="sign"]')
const regForm = document.getElementById('reg')
const loginForm = document.getElementById('sign')

regForm.onsubmit = handleRegister
loginForm.onsubmit = handleLogin


checkAuth()

async function checkAuth() {
  const url = '/api/checkauth'
  const response = await fetch(url)

  if (response.ok) location.href = '/index.html'
  
}

async function handleRegister() {
  const { login, password, confirm } = Object.fromEntries(new FormData(regForm))

  if (password !== confirm) return alert('Password does not match')

  const url = '/api/register'
  const payload = { login, password }
  const init = { method: 'POST', headers: { 'content-type': 'text/json' }, body: JSON.stringify(payload) }
  const response = await fetch(url, init)

  if (response.ok) {
    alert('You was successfully registred and now you have to log in')
    loginRadio.checked = true
  } else {
    alert('Something went wrong, try again')
  }
}

async function handleLogin() {
  const { login, password } = Object.fromEntries(new FormData(loginForm))
  const url = '/api/login'
  const payload = { login, password }
  const init = { method: 'POST', headers: { 'content-type': 'text/json' }, body: JSON.stringify(payload) }
  const response = await fetch(url, init)

  if (response.ok) {
    location.href = './index.html'
  } else {
    alert('Login or password is incorrect!')
  }
}
