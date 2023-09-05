
const [addForm, editForm] = document.forms
const [modalAddTask] = document.getElementsByClassName('glass-add')
const [modalEditTask] = document.getElementsByClassName('glass-edit')
const [addTaskBtn] = document.getElementsByClassName('add-task')
const listId = +Object.fromEntries(location.search.slice(1).split('&').map(pair => pair.split('='))).id
const [toggleDelBtn] = document.getElementsByClassName('toggle-delete')
const [toggleEditBtn] = document.getElementsByClassName('toggle-edit')
const [ol] = document.getElementsByClassName('todo-list')


addTaskBtn.onclick = () => showModal()


window.onkeydown = handleEscape
modalAddTask.onclick = handleClickOut
modalEditTask.onclick = handleClickOut
toggleDelBtn.onclick = toggleActive
toggleEditBtn.onclick = toggleActive
addForm.onsubmit = createTask
editForm.onsubmit = updateTask
ol.addEventListener('click', handleDelete)
ol.addEventListener('click', handleEdit)
ol.addEventListener('change', handleCheck)



getItems().then(showItems)

async function getItems() {
  const url = '/api/tasks/' + listId
  const response = await fetch(url)
  return response.json()
}

function showItems(tasks) {
  console.log(tasks)
  const items = tasks.map(buildItem)
  ol.replaceChildren(...items)
}

function buildItem(task) {
  const item = document.createElement('li')
  item.dataset.id = task.id
  item.innerHTML = `
    <button class="delete">❌</button>
    <label >
      <input type="checkbox" ${task.done ? 'checked' : ''}>
      <div><span>${task.name}</span>${task.note ? ', ' : ''} <span>${task.note}</span></div>
    </label>
  `

  return item
}

function showModal(id, name, note) {
  if (!arguments.length) {
    modalAddTask.hidden = false
  } else {
    modalEditTask.hidden = false
    editForm.name.value = name
    editForm.name.placeholder = name
    editForm.note.value = note
    editForm.note.placeholder = note
    editForm.dataset.id = id
  }
  // const [p] = document.getElementsByClassName('topic') 
  // const [activeBtn] = document.getElementsByClassName('toggle-edit active')
  // if (activeBtn) {
  //   p.innerHTML = "Edit your to do Task"
  //   const editBtn = 
  // }
}

function hideModal(item) {
  modalAddTask.hidden = true
  modalEditTask.hidden = true
}

function handleEscape(e) {
  if (e.key === 'Escape') hideModal()
}

function handleClickOut(e) {
  if (e.target === modalAddTask || e.target === modalEditTask) hideModal()
  if (e.target.classList.contains('cancel')) hideModal()
}

async function createTask() {
  const { name, note } = Object.fromEntries(new FormData(addForm))
  const url = '/api/task'
  const payload = { name, note, listId }
  const init = { method: 'POST', headers: { 'content-type': 'text/json' }, body: JSON.stringify(payload) }
  const response = await fetch(url, init)
  if (response.ok) {
    hideModal()
    getItems().then(showItems)
  }
}

function toggleActive() {
  const activeBtn = this.parentElement.querySelector('.active')
  if (activeBtn && activeBtn !== this) {
    activeBtn.classList.remove('active')
  }
  this.classList.toggle('active')
}

async function handleDelete(e) {
  if (!e.target.matches('.delete')) return
  const id = +e.target.closest('li').dataset.id
  const url = '/api/task'
  const payload = { id, listId }
  const init = { method: 'DELETE', headers: { 'content-type': 'text/json' }, body: JSON.stringify(payload) }
  const response = await fetch(url, init)
  getItems().then(showItems)
}

async function handleEdit(e) {
  if (!toggleEditBtn.classList.contains('active') || e.target === ol) return
  const item = e.target.closest('li')
  const id = item.dataset.id
  const [{ innerText: name }, { innerText: note }] = item.querySelectorAll('span')

  showModal(id, name, note)

}

// function buildEditItem(item) {
//   const [{ innerText: name }, { innerText: note }] = item.querySelectorAll('span')
//   item.classList.add('editable')
//   item.innerHTML = `
//     <input type="text" value="${name}">
//     <input type="text" value="${note}">
//     <button class="save">✔</button>
//     <button class="cancel">❌</button>
//   `
// }


async function handleCheck(e) {
  const item = e.target.closest('li')
  const id = +item.dataset.id
  const done = e.target.checked
  const url = '/api/task'
  const payload = { id, listId, done }
  const init = { method: 'PUT', headers: { 'content-type': 'text/json' }, body: JSON.stringify(payload) }
  const response = await fetch(url, init)
}

async function updateTask() {
  const { name, note } = Object.fromEntries(new FormData(editForm))
  if (name === editForm.name.placeholder && note === editForm.note.placeholder) {
    hideModal()
    return
  }
  const url = '/api/task'
  const id = +editForm.dataset.id
  const payload = { name, note, listId, id }
  const init = { method: 'PUT', headers: { 'content-type': 'text/json' }, body: JSON.stringify(payload) }

  const response = await fetch(url, init)
  if (response.ok) {
    hideModal()
    getItems().then(showItems)
  } else {
    console.log('Something goes wrong, ask Mihail')
  }
}