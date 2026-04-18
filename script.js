function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(pageId).classList.remove('hidden');
}

// COURSES
function addCourse() {
  let input = document.getElementById('courseInput');
  let li = document.createElement('li');
  li.textContent = input.value;
  document.getElementById('courseList').appendChild(li);
  input.value = "";
}

// AGENDA
function addEvent() {
  let input = document.getElementById('eventInput');
  let li = document.createElement('li');
  li.textContent = input.value;
  document.getElementById('eventList').appendChild(li);
  input.value = "";
}

// NOTES
function addNote() {
  let input = document.getElementById('noteInput');
  let li = document.createElement('li');
  li.textContent = input.value;
  document.getElementById('noteList').appendChild(li);
  input.value = "";
}

// SPORT
function addSport() {
  let input = document.getElementById('sportInput');
  let li = document.createElement('li');
  li.textContent = input.value;
  document.getElementById('sportList').appendChild(li);
  input.value = "";
}

// PLANTES
let plantes = ["Barbara", "Calypso", "Aretha", "Tina", "Adèle"];

let plantList = document.getElementById("plantList");

plantes.forEach(p => {
  let li = document.createElement("li");
  let checkbox = document.createElement("input");
  checkbox.type = "checkbox";

  li.appendChild(checkbox);
  li.appendChild(document.createTextNode(" " + p));

  plantList.appendChild(li);
});
