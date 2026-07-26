import http.server
import socketserver
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class PulseHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/send-email':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                to_email = data.get('to')
                subject = data.get('subject')
                message_body = data.get('message')
                
                if not to_email or not subject or not message_body:
                    self.send_json_response(400, {'success': False, 'error': 'Missing parameters'})
                    return
                
                success, err_msg = self.send_email(to_email, subject, message_body)
                
                if success:
                    self.send_json_response(200, {'success': True})
                else:
                    self.send_json_response(500, {'success': False, 'error': err_msg})
            except Exception as e:
                self.send_json_response(500, {'success': False, 'error': str(e)})
        else:
            self.send_json_response(404, {'success': False, 'error': 'Not Found'})

    def send_json_response(self, status, payload):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode('utf-8'))

    def send_email(self, to, subject, body_html):
        sender = "manikandang6002@gmail.com"
        password = "egng lawf xrkk ergn"
        
        try:
            msg = MIMEMultipart()
            msg['From'] = f"Pulse Notifications <{sender}>"
            msg['To'] = to
            msg['Subject'] = subject
            
            # Attach HTML content
            msg.attach(MIMEText(body_html, 'html'))
            
            # Connect to Gmail SMTP
            with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=10) as server:
                server.login(sender, password)
                server.sendmail(sender, to, msg.as_string())
            return True, None
        except Exception as e:
            print(f"[SMTP Error] Failed to send email to {to}: {e}", file=sys.stderr)
            return False, str(e)

class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

def run():
    server_address = ('', PORT)
    httpd = ThreadedHTTPServer(server_address, PulseHandler)
    print(f"Nayaruvi Pulse Server running on http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()

if __name__ == '__main__':
    run()
