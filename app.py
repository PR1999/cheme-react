from flask import Flask, render_template,url_for,request
from datetime import datetime
app = Flask(__name__)
base = "http://127.0.0.1:5000"

@app.route("/")
def home():
    
    link = f"""
    <a href='{base}{url_for('ode')}'>ode</a><br>"""
    return link



@app.route('/ode/')
def ode():
    return render_template('ode.html')