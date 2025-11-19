print ("Hello Welcome to PINE Resort \nPlease enter number of months you want to stay" )
month =  int (input()) 
print  ("Number of months : " +str (month))
print ("Please select type of Room" )
print ("press 1 for Single room price :500/Month \npress 2 for Double room price :800/Month \npress 3 for Suite Room price : 1200/Month")
room = int (input())
if room == 1 :
    print ("your calculate bill in $ is ")
    bill = month * 500
    print (bill)
elif room == 2 :
     print ("your calculate bill in $ is ")
     bill = int ( month * 800)
     print (bill)
elif room == 3 :
    bill = month * 1200
    print (bill)
else :
    print ("You have Entered an Invalid Value")