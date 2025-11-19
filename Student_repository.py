print ("Welcome to ABC school")

students = {1 :{ 'Name' : "zeeshan", "Age" : "25" , "class" : "10" },
           2 : { "Name" : "Fahad", "Age" : "22" , "class" : "8" },
           3 : { "Name" : "Saad", "Age" : "20" , "class" : "7" },
           4 : { "Name" : "zubair", "Age" : "15" , "class" : "6" },
           }

choice = int (input ("Enter 1 to display and 2 to add new student -> "))

def display (students):
    for student_id, info in students.items():
       print (student_id,info)
       print ()
display (students)

def add (students):
    stdid = int (input ("Enter student id : "))
    if stdid in students : 
        print ("student alreday Found")
        return
    
    name = input ("Enter Student name ")
    age = input ("Enter Student age ")
    Class = input ("Enter Student class ")

    students [stdid] = {
        
        "Name" : name,
        "age" : age ,
        "Class" : Class
        }

if choice == 1 :
    display(students)
elif choice == 2:
    add(students)
    display (students)
else :
    print ("Invalid option")
