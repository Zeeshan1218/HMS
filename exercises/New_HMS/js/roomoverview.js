document.addEventListener("DOMContentLoaded", function () {
  const manageRoomCard = document.getElementById("manageRoomCard");
  const manageRoomPanel = document.getElementById("manageRoomPanel");
  const API_URL = "http://127.0.0.1:8000";

  let rooms = [];


  function loadRooms() {
    fetch(`${API_URL}/rooms`)
      .then(res => res.json())
      .then(data => {
        rooms = data.data;
        renderRooms();
      })
      .catch(err => console.error(err));
  }

  function renderRooms() {
    const container = document.getElementById("roomStatusContainer");
    container.innerHTML = "";
    rooms.forEach(room => {
      const card = document.createElement("div");
      card.className = "card-room " + room.status.toLowerCase();
      const capacity = room.capacity || 1;
      const occupancy = room.current_occupancy || 0;
      card.innerHTML = `<h4>Room ${room.room_no}</h4>
                        <p class="${room.status.toLowerCase()}">${room.status}</p>
                        <p style="font-size: 12px; margin: 5px 0;">Capacity: ${capacity}</p>
                        <p style="font-size: 12px; margin: 5px 0;">Occupied: ${occupancy}/${capacity}</p>`;
      container.appendChild(card);
    });
  }

  window.addRoom = function () {
    const count = parseInt(document.getElementById("addRoomCount").value) || 1;
    fetch(`${API_URL}/add-multiple-rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count })
    })
      .then(res => res.json())
      .then(data => {
        console.log(data.message);
        loadRooms();
      })
      .catch(err => console.error(err));
  };

  window.removeRoom = function () {
    const roomNo = parseInt(document.getElementById("removeRoomNumber").value);
    if (!roomNo) {
      alert("Please enter a room number to remove.");
      return;
    }

    fetch(`${API_URL}/remove-room/${roomNo}`, { method: "DELETE" })
      .then(res => res.json())
      .then(data => {
        if (data.error) alert(data.error);
        else console.log(data.message);
        loadRooms();
      })
      .catch(err => console.error(err));
  };

  window.removeLastRooms = function () {
    const count = parseInt(document.getElementById("removeLastCount").value);
    if (!count) {
      alert("Enter number of rooms");
      return;
    }

    fetch(`${API_URL}/remove-last-rooms/${count}`, { method: "DELETE" })
      .then(res => res.json())
      .then(data => {
        if (data.error) alert(data.error);
        else console.log(data.message);
        loadRooms();
      })
      .catch(err => console.error(err));
  };

  manageRoomCard.addEventListener("click", () => {
    manageRoomPanel.style.display =
      manageRoomPanel.style.display === "none" ? "block" : "none";
  });

  function loadStats() {
    fetch(`${API_URL}/stats`)
      .then(res => res.json())
      .then(data => {
        document.getElementById("totalStudents").innerText = data.total_students;
        document.getElementById("availableRooms").innerText = data.availableRooms;
        document.getElementById("occupiedRooms").innerText = data.occupiedRooms;
      })
      .catch(err => console.error("Error loading stats:", err));
  }

  loadStats();
  loadRooms();
});
