function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

/* =======================
   AUTH
======================= */

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(user => {
      document.getElementById("loginPage").style.display = "none";
      document.getElementById("app").style.display = "block";
    })
    .catch(err => alert(err.message));
}

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("app").style.display = "block";
    document.getElementById("currentUser").textContent = user.email;
  }
});

/* =======================
   COURSES (SYNC FIREBASE)
======================= */

function addCourse() {
  db.collection("courses").add({
    text: document.getElementById("courseInput").value,
    user: auth.currentUser.email,
    created: Date.now()
  });
}

db.collection("courses").orderBy("created")
.onSnapshot(snapshot => {
  let list = document.getElementById("courseList");
  list.innerHTML = "";

  snapshot.forEach(doc => {
    let d = doc.data();
    list.innerHTML += `<li><strong>${d.user}</strong> : ${d.text}</li>`;
  });
});

/* =======================
   NOTES
======================= */

function addNote() {
  db.collection("notes").add({
    text: document.getElementById("noteInput").value,
    user: auth.currentUser.email,
    created: Date.now()
  });
}

/* =======================
   SPORT
======================= */

function addSport() {
  db.collection("sport").add({
    text: document.getElementById("sportInput").value,
    user: auth.currentUser.email
  });
}

/* =======================
   PLANTES
======================= */

const plantes = ["Barbara","Calypso","Aretha","Tina","Adèle"];

function renderPlants() {
  let list = document.getElementById("plantList");
  list.innerHTML = "";

  plantes.forEach(name => {
    let li = document.createElement("li");

    let cb = document.createElement("input");
    cb.type = "checkbox";

    li.appendChild(cb);
    li.append(" " + name);

    list.appendChild(li);
  });
}

renderPlants();

/* =======================
   CALENDRIER SIMPLE (local + upgrade Firebase après)
======================= */

let currentDate = new Date();

function renderCalendar() {
  let cal = document.getElementById("calendar");
  cal.innerHTML = "";

  document.getElementById("monthLabel").textContent =
    currentDate.toLocaleString("fr-FR", { month:"long", year:"numeric" });

  let year = currentDate.getFullYear();
  let month = currentDate.getMonth();

  let days = new Date(year, month+1, 0).getDate();

  for (let i=1;i<=days;i++){
    cal.innerHTML += `
      <div class="day">
        <strong>${i}</strong>
        <textarea></textarea>
      </div>
    `;
  }
}

function nextMonth(){
  currentDate.setMonth(currentDate.getMonth()+1);
  renderCalendar();
}

function prevMonth(){
  currentDate.setMonth(currentDate.getMonth()-1);
  renderCalendar();
}

renderCalendar();
