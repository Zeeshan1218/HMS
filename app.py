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

TOTAL_ROOMS = 35
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)  

class Room(BaseModel):
    room_no: int
    room_type: str
    base_price: int
    status: str 
    amenities: List[str] = []
    condition: str = "Average"

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
    occupied_rooms = db.studentslist.count_documents({"room_no": {"$exists": True}})
    available_rooms = TOTAL_ROOMS - occupied_rooms

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
    students = list(db.studentslist.find({}, {"_id": 0, "room_no": 1}))
    occupied_rooms = {s["room_no"] for s in students}
    available_rooms = [i for i in range(1, TOTAL_ROOMS + 1) if i not in occupied_rooms]

    return {"data": [{"room_no": r} for r in available_rooms], "total_available": len(available_rooms)}

@app.post("/add-room")
def add_room(room: Room):
    existing = db.rooms.find_one({"room_no": room.room_no})
    if existing:
        return {"error": f"Room {room.room_no} already exists"}
    
    db.rooms.insert_one(room.dict())
    return {"message": f"Room {room.room_no} added successfully"}

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
    #  CNIC FORMAT VALIDATION
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
        if ext not in ["png", "jpg", "jpeg","jfif" ]:
            raise HTTPException(status_code=400, detail="Only png, jpg, jpeg, jfif, images are allowed.")

        filename = f"{uuid4()}.{ext}"
        image_path = f"{UPLOAD_DIR}/{filename}"

        with open(image_path, "wb") as f:
            f.write(await image.read())

    room = db.rooms.find_one({"room_no": room_no})
    if not room:
        new_room = {
            "room_no": room_no,
            "room_type": room_type,
            "status": "Occupied",
            "base_price": 5000 if room_type.lower() == "single" else 8000,
            "condition": "Average"
        }
        db.rooms.insert_one(new_room)
    else:
        if room.get("status") == "Occupied":
            return {"error": f"Room {room_no} is already occupied"}
        db.rooms.update_one({"room_no": room_no}, {"$set": {"status": "Occupied"}})

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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
