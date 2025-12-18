from typing import List
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from uuid import uuid4
from fastapi.middleware.cors import CORSMiddleware
from pymongo.errors import DuplicateKeyError
from pydantic import BaseModel, Field
from pymongo import MongoClient
from fastapi.staticfiles import StaticFiles
from fastapi import HTTPException
import os, re
import uvicorn
from fastapi.responses import JSONResponse


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = MongoClient("mongodb+srv://admin:admin123@cluster0.s3k39ek.mongodb.net/?appName=Cluster0")
db = client.HMS

db.studentslist.create_index("cnic", unique=True)
BASE_ROOMS = 30  


UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)  

class Room(BaseModel):
    room_no: int
    room_type: str
    base_price: int
    status: str 
    amenities: List[str] = []
    condition: str = "Average"
    capacity: int = 1
    current_occupancy: int = 0

class Student(BaseModel):
    name: str
    cnic: str  
    room_no: int
    admission_date: str
    room_type: str = "Single"
    room_condition: str = "Average"
    amenities: List[str] = []
    monthly_rent: int = 0
    room_status: bool = False 

class StudentResponse(BaseModel): 
    name: str
    room_no: int
    cnic: str
    admission_date: str
    image: str = "uploads/default.png"

@app.get("/stats")
def get_stats():
    total_students = db.studentslist.count_documents({})

    occupied_rooms = db.rooms.count_documents({"status": "Occupied"})
    available_rooms = db.rooms.count_documents({"status": "Available"})

    return {
        "total_students": total_students,
        "availableRooms": available_rooms,
        "occupiedRooms": occupied_rooms
    }

@app.get("/studentslist")
def get_students_with_room():
    students = list(db.studentslist.aggregate([
        {
            "$lookup": {
                "from": "rooms",
                "localField": "room_no",
                "foreignField": "room_no",
                "as": "room_details"
            }
        }
    ]))

    for s in students:
        if "_id" in s:
            s["_id"] = str(s["_id"])
        for room in s["room_details"]:
            if "_id" in room:
                room["_id"] = str(room["_id"])
        if "image" not in s:
            s["image"] = "uploads/default.png"

    return {"total_students": len(students), "data": students}

@app.get("/studentslist/by-cnic/{cnic}", response_model=StudentResponse)
def get_student_by_cnic(cnic: str):
    student = db.studentslist.find_one({"cnic": cnic})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if "image" not in student:
        student["image"] = "uploads/default.png"
    return StudentResponse(**student)

@app.get("/rooms")
def get_rooms():
    rooms = list(db.rooms.find({}, {"_id": 0}))
    return {"total_rooms": len(rooms), "data": rooms}

@app.get("/available_rooms")
def get_available_rooms():
    rooms = list(db.rooms.find(
        {"status": "Available"}, 
        {"_id": 0, "room_no": 1, "room_type": 1, "condition": 1, "amenities": 1}
    ))
    return {
        "data": rooms,
        "total_available": len(rooms)
    }


@app.post("/add-room")
def add_room(room: Room):
    existing = db.rooms.find_one({"room_no": room.room_no})
    if existing:
        return {"error": f"Room {room.room_no} already exists"}
    
    db.rooms.insert_one(room.dict())
    return {"message": f"Room {room.room_no} added successfully"}

@app.put("/update-student/{cnic}")
def update_student(cnic: str, data: dict):
    student = db.studentslist.find_one({"cnic": cnic})
    if not student:
        return {"success": False, "message": "Student not found"}

    db.studentslist.update_one(
        {"cnic": cnic},
        {"$set": {
            "name": data.get("name", student["name"]),
            "room_no": data.get("room_no", student["room_no"]),
            "admission_date": data.get("admission_date", student["admission_date"]),
            "room_status": data.get("room_status", student["room_status"])
        }}
    )

    return {"success": True, "message": "Student updated successfully"}


@app.delete("/delete-student/{cnic}")
def delete_student(cnic: str):
    student = db.studentslist.find_one({"cnic": cnic})
    if not student:
        return JSONResponse(status_code=404, content={"success": False, "message": "Student not found"})

    room = db.rooms.find_one({"room_no": student["room_no"]})
    if room:
        current_occupancy = room.get("current_occupancy", 1)
        new_occupancy = max(0, current_occupancy - 1)
        new_status = "Available" if new_occupancy == 0 else room.get("status", "Occupied")
        
        db.rooms.update_one(
            {"room_no": student["room_no"]}, 
            {"$set": {
                "current_occupancy": new_occupancy,
                "status": new_status
            }}
        )

    db.studentslist.delete_one({"cnic": cnic})

    return {"success": True, "message": "Student deleted successfully"}

@app.post("/add-student")
async def add_student(
    name: str = Form(...),
    cnic: str = Form(...),
    room_no: str = Form(...),         
    room_type: str = Form(...),
    room_condition: str = Form(...),
    monthly_rent: str = Form(...),     
    admission_date: str = Form(...),
    room_status: str = Form(...),      
    amenities: str = Form(None),
    image: UploadFile = File(None)
):
    if not re.match(r"^\d{5}-\d{7}-\d{1}$", cnic):
        raise HTTPException(
            status_code=400,
            detail="Invalid CNIC format. Expected XXXXX-XXXXXXX-X"
        )

    room_no = int(room_no)
    monthly_rent = int(monthly_rent)
    room_status = room_status.lower() == "true"

    image_path = "uploads/default.png"
    if image:
        ext = image.filename.split(".")[-1].lower()
        if ext == "jfif":
            ext = "jpg"
        if ext not in ["png", "jpg", "jpeg"]:
            raise HTTPException(status_code=400, detail="Only png, jpg, jpeg, jfif, images are allowed.")

        filename = f"{uuid4()}.{ext}"
        image_path = f"{UPLOAD_DIR}/{filename}"

        with open(image_path, "wb") as f:
            f.write(await image.read())

    room = db.rooms.find_one({"room_no": room_no})
    if not room:
        capacity_map = {"single": 1, "double": 2, "3-person": 3, "4-person": 4}
        capacity = capacity_map.get(room_type.lower(), 1)
        new_room = {
            "room_no": room_no,
            "room_type": room_type,
            "status": "Occupied",
            "base_price": 5000 if room_type.lower() == "single" else 8000,
            "condition": "Average",
            "capacity": capacity,
            "current_occupancy": 1
        }
        db.rooms.insert_one(new_room)
    else:
        capacity = room.get("capacity", 1)
        current_occupancy = room.get("current_occupancy", 0)
        
        if current_occupancy >= capacity:
            raise HTTPException(
                status_code=400,
                detail=f"Room {room_no} is full. Capacity: {capacity}, Current occupancy: {current_occupancy}"
            )
        
        new_occupancy = current_occupancy + 1
        new_status = "Occupied" if new_occupancy >= capacity else room.get("status", "Available")
        
        db.rooms.update_one(
            {"room_no": room_no}, 
            {"$set": {
                "current_occupancy": new_occupancy,
                "status": new_status
            }}
        )


    student_doc = {
        "name": name,
        "cnic": cnic,
        "room_no": room_no,
        "room_type": room_type,
        "room_condition": room_condition,
        "amenities": amenities.split(",") if amenities else [],
        "monthly_rent": monthly_rent,
        "admission_date": admission_date,
        "room_status": room_status,
        "image": image_path
    }

    try:
        db.studentslist.insert_one(student_doc)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=400,
            detail="CNIC already exists. CNIC must be unique."
        )

    return {"message": "Student added successfully "}

students_collection = db["studentslist"]

def student_serializer(student):
    return {
        "name": student.get("name"),
        "room_no": student.get("room_no"),
        "cnic": student.get("cnic"),
        "admission_date": student.get("admission_date"),
        "image": student.get("image", "uploads/default.png")
    }

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.post("/add-multiple-rooms")
def add_multiple_rooms(data: dict):
    count = data.get("count", 1)
    
    existing_rooms = list(db.rooms.find({}, {"_id": 0, "room_no": 1}))
    BASE_ROOM = 30
    max_room_no = max([r["room_no"] for r in existing_rooms], default=BASE_ROOM - 1)

    new_rooms = []
    for i in range(1, count + 1):
        room_no = max_room_no + i
        existing = db.rooms.find_one({"room_no": room_no})

        if existing:
            if existing["status"] == "Maintenance":
                db.rooms.update_one(
                    {"room_no": room_no},
                    {"$set": {"status": "Available"}}
            )
            new_rooms.append(room_no)
        else:
            db.rooms.insert_one({
    "room_no": room_no,
    "status": "Available",
    "room_type": "single",
    "base_price": 5000,
    "condition": "Average",
    "amenities": [],
    "capacity": 1,
    "current_occupancy": 0
})
            new_rooms.append(room_no)

    return {"message": f"Added rooms: {new_rooms}"}


@app.delete("/remove-room/{room_no}")
def remove_room_api(room_no: int):
    room = db.rooms.find_one({"room_no": room_no})
    if not room:
        return {"error": f"Room {room_no} does not exist"}
    
    if room["status"] == "Occupied":
        return {"error": f"Room {room_no} is occupied and cannot be removed"}
    
    
    max_room_no = max([r["room_no"] for r in db.rooms.find({}, {"_id": 0, "room_no": 1})])
    if room_no == max_room_no:
        db.rooms.delete_one({"room_no": room_no})
        return {"message": f"Room {room_no} removed completely"}
    else:
        
        db.rooms.update_one({"room_no": room_no}, {"$set": {"status": "Maintenance"}})
        return {"message": f"Room {room_no} marked as Maintenance"}
    
@app.delete("/remove-last-rooms/{count}")
def remove_last_rooms(count: int):
    rooms = list(db.rooms.find({}, {"room_no": 1, "status": 1}))
    if not rooms:
        return {"error": "No rooms exist"}

    
    rooms.sort(key=lambda r: r["room_no"], reverse=True)

    removed = []
    for room in rooms:
        if count == 0:
            break
        
        if room["status"] == "Occupied":
            continue

        if room["room_no"] > BASE_ROOMS:
            db.rooms.delete_one({"room_no": room["room_no"]})
            removed.append(room["room_no"])
            count -= 1

    if not removed:
        return {"message": "No removable rooms found (base rooms protected or occupied)"}

    return {"message": f"Removed rooms: {removed}"}
  

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
