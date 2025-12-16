document.addEventListener("DOMContentLoaded", () => { 
  const form = document.querySelector(".newstd_form");
  const roomSelect = document.getElementById("roomno");
  const roomTypeSelect = document.getElementById("roomTypeSelect");
  const roomConditionDiv = document.getElementById("roomConditionDiv");
  const amenitiesDiv = document.getElementById("amenitiesDiv");
  const datesDiv = document.getElementById("datesDiv");

  const baseRoomEl = document.getElementById("baseRoom");
  const conditionPriceEl = document.getElementById("conditionPrice");
  const amenitiesPriceEl = document.getElementById("amenitiesPrice");
  const monthlyRentEl = document.getElementById("monthlyRent");
  const API_URL = "http://127.0.0.1:8000";

  let roomsData = [];

  async function loadRoomsData() {
    try {
      const res = await fetch(`${API_URL}/rooms`);
      const data = await res.json();
      roomsData = data.data;
      console.log("Rooms Data:", roomsData);
    } catch (err) {
      console.error("Error loading rooms data:", err);
    }
  }

  async function loadAvailableRooms() {
    try {
      const res = await fetch(`${API_URL}/available_rooms`);
      const data = await res.json();
      console.log("Available rooms:", data.data);

      roomSelect.innerHTML = `<option value="">Select Available Room</option>`;
      if (Array.isArray(data.data)) {
        data.data.forEach((room) => {
          const option = document.createElement("option");
          option.value = room.room_no;
          option.textContent = `Room ${room.room_no}`;
          roomSelect.appendChild(option);
        });
      }
    } catch (err) {
      console.error("Error loading available rooms:", err);
    }
  }

  function handleRoomSelection() {
    const selectedRoomNo = parseInt(roomSelect.value);
    const selectedRoom = roomsData.find((r) => r.room_no === selectedRoomNo);

    if (isNaN(selectedRoomNo)) {
      roomTypeSelect.parentElement.style.display = "none";
      roomConditionDiv.style.display = "none";
      amenitiesDiv.style.display = "none";
      resetPrices();
      return;
    }

    roomTypeSelect.parentElement.style.display = "block";
    roomConditionDiv.style.display = "block";
    amenitiesDiv.style.display = "block";

    if (!selectedRoom) {
      resetPrices();
      return;
    }

    roomTypeSelect.value = selectedRoom.room_type.toLowerCase();

    document.querySelectorAll('input[name="room_condition"]').forEach((r) => {
      r.checked = r.value.toLowerCase() === selectedRoom.condition.toLowerCase();
    });

    document.querySelectorAll('input[name="amenities"]').forEach((cb) => {
      cb.checked = selectedRoom.amenities.includes(cb.value);
    });

    calculateRent();
  }

  function calculateRent() {
    let baseRoom = 0,
      conditionPrice = 0,
      amenitiesPrice = 0;

    const typeOption = roomTypeSelect.selectedOptions[0];
    if (typeOption && typeOption.dataset.price)
      baseRoom = parseInt(typeOption.dataset.price);

    const conditionSelected = document.querySelector(
      'input[name="room_condition"]:checked'
    );
    if (conditionSelected && conditionSelected.dataset.price)
      conditionPrice = parseInt(conditionSelected.dataset.price);

    const selectedAmenities = document.querySelectorAll(
      'input[name="amenities"]:checked'
    );
    selectedAmenities.forEach(
      (a) => (amenitiesPrice += parseInt(a.dataset.price))
    );

    const checkInDate = new Date(document.getElementById("checkin_date").value);
    const checkOutDate = new Date(
      document.getElementById("checkout_date").value
    );

    let durationInDays = 0;
    if (checkInDate && checkOutDate && checkOutDate > checkInDate) {
      const diffTime = Math.abs(checkOutDate - checkInDate);
      durationInDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const dailyBase = (baseRoom + conditionPrice + amenitiesPrice) / 30;

    if (durationInDays <= 0) {
      monthlyRentEl.textContent = "0 (Select valid dates)";
      return;
    }

    const total = Math.round(dailyBase * durationInDays);

    baseRoomEl.textContent = baseRoom;
    conditionPriceEl.textContent = conditionPrice;
    amenitiesPriceEl.textContent = amenitiesPrice;
    monthlyRentEl.textContent = total;
  }

  function resetPrices() {
    baseRoomEl.textContent = "0";
    conditionPriceEl.textContent = "0";
    amenitiesPriceEl.textContent = "0";
    monthlyRentEl.textContent = "0";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const conditionEl = document.querySelector(
      'input[name="room_condition"]:checked'
    );

    const amenities = Array.from(
      document.querySelectorAll('input[name="amenities"]:checked')
    ).map((a) => a.value).join(",");

    const fileInput = document.getElementById("image");

    if (!roomSelect.value) {
      alert(" Please select a room.");
      return;
    }
    if (!roomTypeSelect.value) {
      alert(" Please select a room type.");
      return;
    }
    if (!conditionEl) {
      alert(" Please select a room condition.");
      return;
    }

    const cnicInput = document.getElementById("cnic").value;

    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    if (!cnicRegex.test(cnicInput)) {
      alert(" CNIC must be 13 digits in format XXXXX-XXXXXXX-X");
      return;
    }

    const formData = new FormData();
    formData.append("name", document.getElementById("name").value);
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
      const response = await fetch(`${API_URL}/add-student`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        alert(" Student registered successfully!");
        form.reset();
        roomTypeSelect.parentElement.style.display = "none";
        roomConditionDiv.style.display = "none";
        amenitiesDiv.style.display = "none";
        resetPrices();
        await loadAvailableRooms();
        datesDiv.style.display = "block";
      } else {
        alert(" " + (result.detail || "Something went wrong"));
      }
    } catch (error) {
      alert(" Server not reachable");
      console.error(error);
    }
  });

 const cnicField = document.getElementById("cnic");

cnicField.addEventListener("input", () => {
  let value = cnicField.value.replace(/\D/g, ""); 
  if (value.length > 13) value = value.slice(0, 13); 

  if (value.length > 5 && value.length < 13) {
   
    value = value.replace(/^(\d{5})(\d+)/, "$1-$2");
  } else if (value.length === 13) {
    
    value = value.replace(/^(\d{5})(\d{7})(\d)$/, "$1-$2-$3");
  }

  cnicField.value = value;
});

  roomSelect.addEventListener("change", handleRoomSelection);
  roomTypeSelect.addEventListener("change", calculateRent);
  document
    .querySelectorAll('input[name="room_condition"]')
    .forEach((el) => el.addEventListener("change", calculateRent));
  document
    .querySelectorAll('input[name="amenities"]')
    .forEach((el) => el.addEventListener("change", calculateRent));
  document
    .getElementById("checkin_date")
    .addEventListener("change", calculateRent);
  document
    .getElementById("checkout_date")
    .addEventListener("change", calculateRent);

  async function init() {
    await loadRoomsData();       
    await loadAvailableRooms();  
    handleRoomSelection();      
  }
  init();
});
