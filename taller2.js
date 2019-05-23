var DB_NAME = 'todo-list';
var DB_VERSION = 1;
var STORE_NAME = 'tasks';
var db;

document.addEventListener("DOMContentLoaded", initDB);

function initDB() {
  let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB

  if ( ! indexedDB) {
    alert('Este navegador no soporta IndexedDB');
  }

  let request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onupgradeneeded = () => {
    db = request.result;
    if ( ! db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
    }
  };
    
  request.onsuccess = async () => {
    db = request.result;
    document.querySelector("#btn-agregar").disabled = false;
  
    getFromDB();
  }
}

function getFromRepo() {
  const REPO = "http://my-json-server.typicode.com/emiliotapia/taller2/todos";

  fetch(REPO)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw Error(response.status)
      }
    })
    .then(tasks => {
      for (var i = tasks.length - 1; i >= 0; i--) {
        store(tasks[i]);
      }
      console.log("Datos cargados desde el respositorio.");
    })
    .catch(err => {
      console.log(err);
    });
}

function getFromDB() {
  let transaction = db.transaction(STORE_NAME, 'readonly');
  let objectStore = transaction.objectStore(STORE_NAME);

  if ('getAll' in objectStore) {
    objectStore.getAll().onsuccess = (event) => {
      tasks = event.target.result;
      if (typeof tasks === 'undefined' || tasks.length == 0) {
        getFromRepo();
        return;
      }

      updateTodoList(tasks);
    };
  }
}

function add() {
  let input = document.querySelector("#nuevatarea-ipt");
	let text = input.value;
	let task = create(text);
	store(task);
  input.value = "";
	return false;
}

function create(text) {
	return {
		texto: text,
		terminado: false,
	}
}

function store(task) {
	let transaction = db.transaction(STORE_NAME, 'readwrite');
	let objectStore = transaction.objectStore(STORE_NAME);

	let request = objectStore.add(task);
	
  request.onsuccess = () => {
		updateTodoList();
	};

  request.error = () => {
    console.log("error al guardar");
  }
}

function update(taskId) {
  let transaction = db.transaction(STORE_NAME, 'readwrite');
  let objectStore = transaction.objectStore(STORE_NAME);

  var request = objectStore.get(taskId);

  request.onsuccess = (event) => {
    let task = event.target.result;
    task.terminado = document.querySelector("#check" + taskId).checked;

    let updateRequest = objectStore.put(task);

    updateRequest.onsuccess = () => {
      updateTodoList();
    }

    updateRequest.error = () => {
      console.log("error al actualizar");
    }
  };

  request.error = () => {
    console.log("error al guardar");
  };
}

function remove(taskId) {
  let transaction = db.transaction(STORE_NAME, 'readwrite');
  let objectStore = transaction.objectStore(STORE_NAME);

  let request = objectStore.delete(taskId)
  
  request.onsuccess = () => {
    updateTodoList();
  };

  request.error = () => {
    console.log("error al eliminar");
  };
}

function updateTodoList(tasks) {
  if (typeof tasks === "undefined") {
    getFromDB();
    return;
  }

	let ul = document.querySelector("#lista-todo");

  let child = ul.lastElementChild;  
  while (child) { 
    ul.removeChild(child); 
    child = ul.lastElementChild; 
  }

	let li, input, label, button;

  for (let i = 0; i < tasks.length; i++) {
    li = document.createElement("li");
  	li.classList.add("tarea");

    input = document.createElement("input");
    input.type = "checkbox";
    input.id = "check" + tasks[i].id;
    input.onchange = () => {
      update(tasks[i].id);
    }

    if (tasks[i].terminado) {
      input.checked = "checked";
    }

    label = document.createElement("label");
    label.for = "check" + tasks[i].id;
    label.innerText = tasks[i].texto;

    button = document.createElement("button");
    button.classList.add("boton");
    button.onclick = () => {
      remove(tasks[i].id);
    }
    button.innerText = "borrar";

    li.appendChild(input);
    li.appendChild(label);
    li.appendChild(button);

    ul.appendChild(li);
  }
}