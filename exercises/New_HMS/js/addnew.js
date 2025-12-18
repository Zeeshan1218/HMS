document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".newstd_form");
  const nameField = document.getElementById("name");
  const roomTypeSelect = document.getElementById("roomTypeSelect");
  const roomSelect = document.getElementById("roomno");
  const roomConditionDiv = document.getElementById("roomConditionDiv");
  const amenitiesDiv = document.getElementById("amenitiesDiv");
  const roomNoDiv = document.getElementById("roomNoDiv");
  const datesDiv = document.getElementById("datesDiv");

  const baseRoomEl = document.getElementById("baseRoom");
  const conditionPriceEl = document.getElementById("conditionPrice");
  const amenitiesPriceEl = document.getElementById("amenitiesPrice");
  const monthlyRentEl = document.getElementById("monthlyRent");

  const checkInInput = document.getElementById("checkin_date");
  const checkOutInput = document.getElementById("checkout_date");

  const API_URL = "http://127.0.0.1:8000";
  let roomsData = [];

  // ----------------- Date Restrictions -----------------
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  checkInInput.setAttribute("min", todayStr);

  checkInInput.addEventListener("change", () => {
    const checkInDate = new Date(checkInInput.value);
    const todayCopy = new Date();
    todayCopy.setHours(0, 0, 0, 0);

    if (checkInDate < todayCopy) {
      alert("Check-in date cannot be earlier than today.");
      checkInInput.value = "";
      return;
    }

    checkOutInput.setAttribute("min", checkInInput.value);

    if (checkOutInput.value) {
      const checkOutDate = new Date(checkOutInput.value);
      if (checkOutDate <= checkInDate) {
        alert("Check-out date must be after check-in date.");
        checkOutInput.value = "";
      }
    }
  });

  checkOutInput.addEventListener("change", () => {
    if (!checkInInput.value) {
      alert("Please select a valid check-in date first.");
      checkOutInput.value = "";
      return;
    }
    const checkInDate = new Date(checkInInput.value);
    const checkOutDate = new Date(checkOutInput.value);
    if (checkOutDate <= checkInDate) {
      alert("Check-out date must be after check-in date.");
      checkOutInput.value = "";
    }
  });

  // ----------------- Load Rooms -----------------
  async function loadRoomsData() {
    try {
      const res = await fetch(`${API_URL}/rooms`);
      const data = await res.json();
      roomsData = data.data;
    } catch (err) {
      console.error("", err);
    }
  }

  async function loadAvailableRooms() {
  try {
    // Fetch all available rooms from backend
    const res = await fetch(`${API_URL}/available_rooms`);
    const data = await res.json();

    // No filtering by room type here
    const availableRooms = data.data;

    // Clear previous options
    roomSelect.innerHTML = `<option value="">Select Room</option>`;

    // Populate dropdown
    availableRooms.forEach(room => {
      const option = document.createElement("option");
      option.value = room.room_no;
      option.textContent = `Room ${room.room_no}`;
      roomSelect.appendChild(option);
    });

    // Show or hide room number section
    if (availableRooms.length > 0) {
      roomNoDiv.style.display = "block";
      roomSelect.value = ""; // force user to select
      roomConditionDiv.style.display = "none";
      amenitiesDiv.style.display = "none";
      resetPrices();
    } else {
      roomNoDiv.style.display = "none";
      roomConditionDiv.style.display = "none";
      amenitiesDiv.style.display = "none";
      resetPrices();
      alert("No available rooms.");
    }
  } catch (err) {
    console.error("Error loading available rooms:", err);
    roomSelect.innerHTML = `<option value="">Error loading rooms</option>`;
  }
}


  // ----------------- Handle Room Selection -----------------
  function handleRoomSelection() {
    const selectedRoomNo = parseInt(roomSelect.value);
    const selectedRoom = roomsData.find(r => Number(r.room_no) === selectedRoomNo);

    if (isNaN(selectedRoomNo)) {
      roomConditionDiv.style.display = "none";
      amenitiesDiv.style.display = "none";
      resetPrices();
      return;
    }

    if (selectedRoom) {
      roomConditionDiv.style.display = "block";
      amenitiesDiv.style.display = "block";

      document.querySelectorAll('input[name="room_condition"]').forEach(r => {
        r.checked = r.value.toLowerCase() === selectedRoom.condition.toLowerCase();
      });

      document.querySelectorAll('input[name="amenities"]').forEach(cb => {
        cb.checked = selectedRoom.amenities.includes(cb.value);
      });

      calculateRent();
    }
  }

  // ----------------- Calculate Rent -----------------
  function calculateRent() {
    let baseRoom = 0, conditionPrice = 0, amenitiesPrice = 0;
    const typeOption = roomTypeSelect.selectedOptions[0];
    if (typeOption && typeOption.dataset.price) baseRoom = parseInt(typeOption.dataset.price);

    const conditionSelected = document.querySelector('input[name="room_condition"]:checked');
    if (conditionSelected && conditionSelected.dataset.price)
      conditionPrice = parseInt(conditionSelected.dataset.price);

    document.querySelectorAll('input[name="amenities"]:checked').forEach(a => {
      amenitiesPrice += parseInt(a.dataset.price);
    });

    const checkInDate = new Date(checkInInput.value);
    const checkOutDate = new Date(checkOutInput.value);
    let durationInDays = 0;

    if (checkInDate && checkOutDate && checkOutDate > checkInDate) {
      const diffTime = Math.abs(checkOutDate - checkInDate);
      durationInDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const dailyBase = (baseRoom + conditionPrice + amenitiesPrice) / 30;
    const total = durationInDays > 0 ? Math.round(dailyBase * durationInDays) : 0;

    baseRoomEl.textContent = baseRoom;
    conditionPriceEl.textContent = conditionPrice;
    amenitiesPriceEl.textContent = amenitiesPrice;
    monthlyRentEl.textContent = total > 0 ? total : "0 (Select valid dates)";
  }

  function resetPrices() {
    baseRoomEl.textContent = "0";
    conditionPriceEl.textContent = "0";
    amenitiesPriceEl.textContent = "0";
    monthlyRentEl.textContent = "0";
  }

const cnicField = document.getElementById("cnic");
const cnicErrorEl = document.getElementById("cnicError"); // Make sure this div exists below CNIC input

cnicField.addEventListener("input", () => {
  let value = cnicField.value.replace(/\D/g, "");
  if (value.length > 13) value = value.slice(0, 13);
  
  if (value.length > 5 && value.length < 13) value = value.replace(/^(\d{5})(\d+)/, "$1-$2");
  else if (value.length === 13) value = value.replace(/^(\d{5})(\d{7})(\d)$/, "$1-$2-$3");
  
  cnicField.value = value;
  
  cnicErrorEl.textContent = "";
});

const nameErrorEl = document.getElementById("nameError"); // Make sure this div exists below Name input

function validateName() {
  const nameInput = nameField.value.trim();
  let valid = true;

  if (!nameInput) {
    nameErrorEl.textContent = "Name is required.";
    valid = false;
  } else if (!/^[A-Za-z\s]+$/.test(nameInput)) {
    nameErrorEl.textContent = "Name can only contain letters and spaces.";
    valid = false;
  } else if (nameInput.length < 3 || nameInput.length > 20) {
    nameErrorEl.textContent = "Name must be between 3 and 20 characters.";
    valid = false;
  } else {
    nameErrorEl.textContent = ""; // Clear error if valid
  }

  return valid;
}

nameField.addEventListener("blur", validateName);

function validateCNIC() {
  const value = cnicField.value.trim();
  let valid = true;

  if (!value) {
    cnicErrorEl.textContent = "CNIC is required.";
    valid = false;
  } else if (!/^\d{5}-\d{7}-\d{1}$/.test(value)) {
    cnicErrorEl.textContent = "CNIC must be in XXXXX-XXXXXXX-X format.";
    valid = false;
  } else {
    cnicErrorEl.textContent = "";
  }

  return valid;
}

cnicField.addEventListener("blur", validateCNIC);


  roomTypeSelect.addEventListener("change", async () => {
    if (!roomTypeSelect.value) {
      roomNoDiv.style.display = "none";
      roomConditionDiv.style.display = "none";
      amenitiesDiv.style.display = "none";
      resetPrices();
      return;
    }

    roomNoDiv.style.display = "block";
    roomSelect.innerHTML = `<option value="">Loading rooms...</option>`;

    await loadAvailableRooms(roomTypeSelect.value);
  });

  roomSelect.addEventListener("change", handleRoomSelection);
  roomTypeSelect.addEventListener("change", calculateRent);
  document.querySelectorAll('input[name="room_condition"]').forEach(el => el.addEventListener("change", calculateRent));
  document.querySelectorAll('input[name="amenities"]').forEach(el => el.addEventListener("change", calculateRent));

  form.addEventListener("submit", async e => {
    e.preventDefault();

    if (!validateName()) { nameField.focus(); return; }

    const conditionEl = document.querySelector('input[name="room_condition"]:checked');
    const amenities = Array.from(document.querySelectorAll('input[name="amenities"]:checked')).map(a => a.value).join(",");
    if (!roomTypeSelect.value) { alert("Please select a room type."); return; }
    if (!roomSelect.value) { alert("Please select a room number."); return; }
    if (!conditionEl) { alert("Please select a room condition."); return; }

    const cnicInput = cnicField.value;
    if (!/^\d{5}-\d{7}-\d{1}$/.test(cnicInput)) { alert("CNIC must be in XXXXX-XXXXXXX-X format."); cnicField.focus(); return; }

    const checkInDate = new Date(checkInInput.value);
    const checkOutDate = new Date(checkOutInput.value);
    if (checkInDate < today || checkOutDate <= checkInDate) {
      alert("Select valid check-in and check-out dates.");
      return;
    }

    const fileInput = document.getElementById("image");
    const formData = new FormData();
    formData.append("name", nameField.value.trim());
    formData.append("cnic", cnicInput);
    formData.append("room_no", parseInt(roomSelect.value));
    formData.append("room_type", roomTypeSelect.value);
    formData.append("room_condition", conditionEl.value);
    formData.append("monthly_rent", parseInt(monthlyRentEl.textContent));
    formData.append("admission_date", new Date().toISOString().split("T")[0]);
    formData.append("room_status", "true");
    formData.append("amenities", amenities);
    if (fileInput.files.length > 0) formData.append("image", fileInput.files[0]);

    try {
      const response = await fetch(`${API_URL}/add-student`, { method: "POST", body: formData });
      const result = await response.json();
      if (response.ok) {
        alert("Student registered successfully!");
        form.reset();
        roomNoDiv.style.display = "none";
        roomConditionDiv.style.display = "none";
        amenitiesDiv.style.display = "none";
        resetPrices();
      } else {
        alert(result.detail || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      alert("Server not reachable");
    }
  });

  async function init() {
    await loadRoomsData();
    document.getElementById("roomtype").style.display = "block"; // Room type always visible
    roomNoDiv.style.display = "none";
    roomConditionDiv.style.display = "none";
    amenitiesDiv.style.display = "none";
    resetPrices();
  }

  init();
});
