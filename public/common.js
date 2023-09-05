
checkAuth()

onload = () => {
  const [logoutBtn] = document.getElementsByTagName('button')

  logoutBtn.onclick = handleLogout
}

async function handleLogout() {
  const url = '/api/logout'
  const response = await fetch(url)

  location.href = '/auth.html'
}

async function checkAuth() {
  const url = '/api/checkauth'
  const response = await fetch(url)

  if (!response.ok) location.href = '/auth.html'
}
