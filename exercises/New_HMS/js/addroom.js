document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".newroom_form");
    const roomTypeSelect = document.getElementById("roomTypeSelect");
    const basePriceInput = document.getElementById("base_price");
    const API_URL = "http://127.0.0.1:8000";

    roomTypeSelect.addEventListener("change", () => {
        const selectedOption = roomTypeSelect.selectedOptions[0];
        if (selectedOption && selectedOption.dataset.price) {
            basePriceInput.value = selectedOption.dataset.price;
        }
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const roomNo = parseInt(document.getElementById("room_no").value);
        const roomType = roomTypeSelect.value;
        const conditionEl = document.querySelector('input[name="room_condition"]:checked');
        const amenities = Array.from(
            document.querySelectorAll('input[name="amenities"]:checked')
        ).map((a) => a.value);
        const basePrice = parseInt(basePriceInput.value);

        const roomNoError = document.getElementById("roomNoError");
        const roomTypeError = document.getElementById("roomTypeError");
        roomNoError.textContent = "";
        roomTypeError.textContent = "";

        if (!roomNo || roomNo < 1) {
            roomNoError.textContent = "Please enter a valid room number (minimum 1)";
            return;
        }

        if (!roomType) {
            roomTypeError.textContent = "Please select a room type";
            return;
        }

        if (!conditionEl) {
            alert("Please select a room condition.");
            return;
        }

        let capacity = 1;
        const roomTypeLower = roomType.toLowerCase();
        if (roomTypeLower === "single") {
            capacity = 1;
        } else if (roomTypeLower === "double") {
            capacity = 2;
        } else if (roomTypeLower === "3-person") {
            capacity = 3;
        } else if (roomTypeLower === "4-person") {
            capacity = 4;
        }

        const roomData = {
            room_no: roomNo,
            room_type: roomType,
            base_price: basePrice,
            status: "Available",
            amenities: amenities,
            condition: conditionEl.value,
            capacity: capacity,
            current_occupancy: 0
        };

        try {
            const response = await fetch(`${API_URL}/add-room`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(roomData),
            });

            const result = await response.json();

            if (response.ok) {
                if (result.error) {
                    roomNoError.textContent = result.error;
                } else {
                    alert(`Room ${roomNo} added successfully!`);
                    form.reset();
                    basePriceInput.value = "5000";
                    roomNoError.textContent = "";
                    roomTypeError.textContent = "";
                }
            } else {
                alert(result.detail || result.error || "Something went wrong");
            }
        } catch (error) {
            alert("Server not reachable");
            console.error(error);
        }
    });
});
