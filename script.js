function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(pageId).classList.remove('hidden');
}

// GENERIC SAVE
function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function load(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

// COURSES
let courses = load("courses");

function renderCourses() {
  let list = document.getElementById('courseList');
  list.innerHTML = "";
  courses.forEach(c => {
    let li = document.createElement('li');
    li.textContent = c;
    list.appendChild(li);
  });
}

function addCourse() {
  let input = document.getElementById('courseInput');
  courses.push(input.value);
  save("courses", courses);
  renderCourses();
  input.value = "";
}

// AGENDA
let events = load("events");

function renderEvents() {
  let list = document.getElementById('eventList');
  list.innerHTML = "";
  events.forEach(e => {
    let li = document.createElement('li');
    li.textContent = e;
    list.appendChild(li);
  });
}

function addEvent() {
  let input = document.getElementById('eventInput');
  events.push(input.value);
  save("events", events);
  renderEvents();
  input.value = "";
}

// NOTES
let notes = load("notes");

function renderNotes() {
  let list = document.getElementById('noteList');
  list.innerHTML = "";
  notes.forEach(n => {
    let li = document.createElement('li');
    li.textContent = n;
    list.appendChild(li);
  });
}

function addNote() {
  let input = document.getElementById('noteInput');
  notes.push(input.value);
  save("notes", notes);
  renderNotes();
  input.value = "";
}

// SPORT
let sports = load("sports");

function renderSports() {
  let list = document.getElementById('sportList');
  list.innerHTML = "";
  sports.forEach(s => {
    let li = document.createElement('li');
    li.textContent = s;
    list.appendChild(li);
  });
}

function addSport() {
  let input = document.getElementById('sportInput');
  sports.push(input.value);
  save("sports", sports);
  renderSports();
  input.value = "";
}

// PLANTES
let plantes = [
  { name: "Barbara", done: false },
  { name: "Calypso", done: false },
  { name: "Aretha", done: false },
  { name: "Tina", done: false },
  { name: "Adèle", done: false }
];

let savedPlants = load("plants");
if (savedPlants.length) plantes = savedPlants;

function renderPlants() {
  let list = document.getElementById("plantList");
  list.innerHTML = "";

  plantes.forEach((p, index) => {
    let li = document.createElement("li");

    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = p.done;

    checkbox.onchange = () => {
      plantes[index].done = checkbox.checked;
      save("plants", plantes);
    };

    li.appendChild(checkbox);
    li.appendChild(document.createTextNode(" " + p.name));

    list.appendChild(li);
  });
}

// INIT
renderCourses();
renderEvents();
renderNotes();
renderSports();
renderPlants();


function requestNotification() {
  if (Notification.permission !== "granted") {
    Notification.requestPermission();
  }
}

function remindPlants() {
  if (Notification.permission === "granted") {
    new Notification("🌱 Arrose les plantes !");
  }
}

// Demande permission
requestNotification();

// Rappel toutes les semaines (simulation: 10s pour tester)
setInterval(remindPlants, 10000);


//Calendar
let currentDate = new Date();

function renderCalendar() {
  let calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  let monthLabel = document.getElementById("monthLabel");
  monthLabel.textContent = currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

  let year = currentDate.getFullYear();
  let month = currentDate.getMonth();

  let firstDay = new Date(year, month, 1).getDay();
  let daysInMonth = new Date(year, month + 1, 0).getDate();

  let saved = JSON.parse(localStorage.getItem("calendar")) || {};

  for (let i = 0; i < firstDay; i++) {
    calendar.innerHTML += `<div></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    let key = `${year}-${month}-${d}`;
    let value = saved[key] || "";

    let div = document.createElement("div");
    div.className = "day";

    div.innerHTML = `
      <strong>${d}</strong>
      <textarea onchange="saveDay('${key}', this.value)">${value}</textarea>
    `;

    calendar.appendChild(div);
  }
}

function saveDay(key, value) {
  let data = JSON.parse(localStorage.getItem("calendar")) || {};
  data[key] = value;
  localStorage.setItem("calendar", JSON.stringify(data));
}

function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
}

function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
}

renderCalendar();


// Login
function login() {
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById("loginPage").style.display = "none";
      document.getElementById("app").style.display = "block";
    })
    .catch(err => alert(err.message));
}

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("app").style.display = "block";
  }
});
