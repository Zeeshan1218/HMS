from flask import Flask
app = Flask (__name__)
@app.route("/")
def home():
    return "Hello, Flask is working!"
@app.route("/calculated")
def home1():
    return "Hello, Flask is not working!"

if __name__ == "__main__":
    app.run(debug=True)

