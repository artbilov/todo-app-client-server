const { readdirSync, rename } = require("fs")

const path = './public/avatars'
massRename(path)

function massRename(path) {
  const fileNames = readdirSync(path)

  for (const name of fileNames) {
    const [newName] = name.match(/[a-z]+_[a-z]+.svg$/)
    const oldPath = path + '/' + name
    const newPath = path + '/' + newName

    rename(oldPath, newPath, function (err) {
      if (err) {
        console.log('Ошибка переименования файла: ' + err);
      } else {
        console.log('Файл успешно переименован')
      }
    })
  }
}

