document.addEventListener("DOMContentLoaded", function () {
  const API_URL = "http://127.0.0.1:8000";

  function loadStats() {
    fetch(`${API_URL}/stats`)
      .then((res) => res.json())
      .then((data) => {
        document.getElementById("totalStudents").innerText =
          data.total_students;
        document.getElementById("availableRooms").innerText =
          data.availableRooms;
        document.getElementById("occupiedRooms").innerText = data.occupiedRooms;
      })
      .catch((err) => console.error(err));
  }

  function loadRooms() {
    fetch(`${API_URL}/studentslist`)
      .then((res) => res.json())
      .then((data) => {
        const students = data.data;
        const container = document.getElementById("roomStatusContainer");
        container.innerHTML = "";

        const TOTAL_ROOMS = 35;
        for (let i = 1; i <= TOTAL_ROOMS; i++) {
          const roomStudent = students.find((s) => s.room_no === i);
          const status = roomStudent ? "Occupied" : "Available";

          const card = document.createElement("div");
          card.classList.add("card-room");
          card.classList.add(roomStudent ? "occupied" : "available");

          const statusP = document.createElement("p");
          statusP.classList.add(roomStudent ? "occupied" : "available");
          statusP.innerText = status;

          card.innerHTML = `<h4>Room ${i}</h4>`;
          card.appendChild(statusP);

          container.appendChild(card);
        }
      })
      .catch((err) => console.error(err));
  }

  loadStats();
  loadRooms();

  setInterval(() => {
    loadStats();
    loadRooms();
  }, 5000);
});
