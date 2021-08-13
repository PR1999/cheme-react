from flask import Flask, render_template,url_for,request
from datetime import datetime
app = Flask(__name__)
base = "http://127.0.0.1:5000"

@app.route("/")
def home():
    
    link = f"""<a href='{base}{url_for('hello')}' >hello</a><br>
    <a href='{base}{url_for('cool')}'>cool</a><br>
    <a href='{base}{url_for('test')}'>test</a><br>
    <a href='{base}{url_for('ode')}'>ode</a><br>"""
    return link

@app.route('/hello/')
@app.route('/hello/<name>') 
def hello(name=None):
    now = datetime.now()
    formattedtime = now.strftime("%A %d %B")
    return render_template('app.html', name=name, now=formattedtime)

@app.route('/cool/')
def cool():
    return render_template('coolding.html')

@app.route('/test/', methods=['GET','POST'])
def test():
    if request.method == 'POST':
        return render_template('coolding.html')
    return render_template('test.html')

@app.route('/ode/')
def ode():
    return render_template('ode.html')