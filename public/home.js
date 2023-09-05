
const [form] = document.forms
const [createBtn] = document.getElementsByClassName('create')
const [cancelBtn] = document.getElementsByClassName('cancel')
const [modal] = document.getElementsByClassName('glass')
const [avatarPicker] = document.getElementsByClassName('avatar-picker')
const [avatarSelect] = document.getElementsByTagName('select')
const [avatarBtn] = document.getElementsByClassName('btn-avatar')

createBtn.onclick = showModal
window.onkeydown = handleEscape
modal.onclick = handleClickOut
cancelBtn.onclick = hideModal
form.onsubmit = createList
avatarPicker.onclick = handleSelect
avatarBtn.onclick = showPicker


getTaskLists().then(showTaskLists)

async function getTaskLists() {
  const url = '/api/tasklists'
  const response = await fetch(url)
  return response.json()
}

function showTaskLists(taskLists) {
  console.log(taskLists)
  const [ul] = document.getElementsByClassName('list-group')
  const items = taskLists.map(buildListItem)
  ul.replaceChildren(...items)
}

function buildListItem(item) {
  const li = document.createElement('li')
  li.className = 'todo-item'
  const { id, date, name, avatar } = item
  li.innerHTML = `
    <a href="items.html?id=${id}">
      <h4>${date} - ${name}</h4>
      <img src="${avatar || './avatars/water_onsen.svg'}" alt="todo-avatar">
    </a>
  `
  return li
}

async function createList() {
  const url = '/api/tasklist'
  const taskList = Object.fromEntries(new FormData(form))
  const init = { method: 'POST', headers: { 'content-type': 'text/json' }, body: JSON.stringify(taskList) }
  const response = await fetch(url, init)
  hideModal()
  avatarBtn.firstElementChild.setAttribute('src', './avatars/default_avatar.svg')
  getTaskLists().then(showTaskLists)
}

function showModal() {
  modal.hidden = false
}

function hideModal() {
  modal.hidden = true
}

function handleEscape(e) {
  if (e.key === 'Escape') hideModal()
}

function handleClickOut(e) {
  if (e.target === modal) hideModal()
}

function handleSelect(e) {
  if (e.target === avatarPicker) return
  avatarSelect.value = e.target.closest('button').firstElementChild.getAttribute ('src') || ''
  avatarPicker.hidden = true
  avatarBtn.firstElementChild.setAttribute('src', avatarSelect.value)
  e.preventDefault() 
}

function showPicker() {
  avatarPicker.hidden = false
}

