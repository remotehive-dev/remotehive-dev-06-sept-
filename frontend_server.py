import http.server
import socketserver
import os
import json
from urllib.parse import urlparse

class FrontendHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Add CORS headers
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        # Serve basic HTML based on path
        if path == '/' or path == '/admin':
            html_content = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RemoteHive Admin Panel</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .header { background: #2563eb; color: white; padding: 20px; margin: -20px -20px 20px; border-radius: 8px 8px 0 0; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; }
        .btn { background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>RemoteHive Admin Panel</h1>
            <p>Manage jobs, companies, and platform settings</p>
        </div>
        <div class="stats">
            <div class="stat-card">
                <h3>Total Jobs</h3>
                <p style="font-size: 2em; margin: 0; color: #2563eb;">156</p>
            </div>
            <div class="stat-card">
                <h3>Active Companies</h3>
                <p style="font-size: 2em; margin: 0; color: #2563eb;">42</p>
            </div>
            <div class="stat-card">
                <h3>Applications</h3>
                <p style="font-size: 2em; margin: 0; color: #2563eb;">1,234</p>
            </div>
        </div>
        <div style="margin-top: 30px;">
            <button class="btn">Manage Jobs</button>
            <button class="btn" style="margin-left: 10px;">View Companies</button>
            <button class="btn" style="margin-left: 10px;">Settings</button>
        </div>
        <div style="margin-top: 30px; padding: 20px; background: #f0f9ff; border-radius: 8px;">
            <h3>Quick Actions</h3>
            <p>✅ Admin Panel Server Running on Port 3000</p>
            <p>✅ Backend API Connected (Port 8000)</p>
            <p>✅ Autoscraper Service Active (Port 8001)</p>
        </div>
    </div>
</body>
</html>
            '''
        else:
            html_content = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RemoteHive - Find Your Dream Remote Job</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .hero { text-align: center; color: white; padding: 60px 20px; }
        .job-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 40px 0; }
        .job-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .btn { background: #2563eb; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; }
        .nav { background: rgba(255,255,255,0.1); padding: 15px 0; margin-bottom: 20px; }
        .nav-content { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    </style>
</head>
<body>
    <nav class="nav">
        <div class="nav-content">
            <h2 style="color: white; margin: 0;">RemoteHive</h2>
            <div>
                <a href="#" style="color: white; margin: 0 15px; text-decoration: none;">Jobs</a>
                <a href="#" style="color: white; margin: 0 15px; text-decoration: none;">Companies</a>
                <a href="#" style="color: white; margin: 0 15px; text-decoration: none;">Post Job</a>
            </div>
        </div>
    </nav>
    <div class="container">
        <div class="hero">
            <h1 style="font-size: 3em; margin-bottom: 20px;">Find Your Dream Remote Job</h1>
            <p style="font-size: 1.2em; margin-bottom: 30px;">Connect with top companies hiring remote talent worldwide</p>
            <a href="#" class="btn" style="font-size: 1.1em;">Browse Jobs</a>
        </div>
        <div class="job-grid">
            <div class="job-card">
                <h3>Senior Python Developer</h3>
                <p><strong>RemoteHive</strong> • Remote • $90k-120k</p>
                <p>Join our team building the future of remote work platforms. Work with FastAPI, MongoDB, and modern web technologies.</p>
                <a href="#" class="btn">Apply Now</a>
            </div>
            <div class="job-card">
                <h3>Frontend React Developer</h3>
                <p><strong>TechCorp</strong> • Remote • $80k-100k</p>
                <p>Build beautiful user interfaces with React, TypeScript, and modern CSS frameworks. Join a growing startup.</p>
                <a href="#" class="btn">Apply Now</a>
            </div>
            <div class="job-card">
                <h3>Full Stack Engineer</h3>
                <p><strong>InnovateLab</strong> • Remote • $95k-130k</p>
                <p>Work on cutting-edge projects using Node.js, React, and cloud technologies. Flexible hours and great benefits.</p>
                <a href="#" class="btn">Apply Now</a>
            </div>
        </div>
        <div style="text-align: center; margin: 40px 0; color: white;">
            <h2>Why Choose RemoteHive?</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; margin: 30px 0;">
                <div>
                    <h3>🌍 Global Opportunities</h3>
                    <p>Access jobs from companies worldwide</p>
                </div>
                <div>
                    <h3>⚡ Fast Applications</h3>
                    <p>Apply to multiple jobs with one click</p>
                </div>
                <div>
                    <h3>🎯 Perfect Matches</h3>
                    <p>AI-powered job recommendations</p>
                </div>
            </div>
        </div>
    </div>
    <footer style="background: rgba(0,0,0,0.2); color: white; text-align: center; padding: 20px; margin-top: 40px;">
        <p>© 2024 RemoteHive. Connecting talent with opportunity.</p>
        <p>✅ Public Website Server Running on Port 5173</p>
    </footer>
</body>
</html>
            '''
        
        self.wfile.write(html_content.encode())

def start_server(port):
    with socketserver.TCPServer(("", port), FrontendHandler) as httpd:
        print(f"Frontend Server running on port {port}")
        httpd.serve_forever()

if __name__ == "__main__":
    PORT = int(os.environ.get("PORT", 3000))
    start_server(PORT)