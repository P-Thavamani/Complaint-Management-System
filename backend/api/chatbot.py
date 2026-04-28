from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
from datetime import datetime
import os
import base64
import tempfile
# Optional ML dependencies - only import if available
try:
    import speech_recognition as sr
    import numpy as np
    from pydub import AudioSegment
    # from ultralytics import YOLO  # Commented out for lighter deployment
    # import cv2  # Commented out for lighter deployment
    ML_FEATURES_AVAILABLE = True
except ImportError:
    ML_FEATURES_AVAILABLE = False
    print("ML features not available - some functionality will be limited")
from utils.auth_middleware import token_required
import uuid
import google.generativeai as genai
from utils.notifications import send_thank_you_notifications, send_ticket_creation_notification
import re

chatbot_bp = Blueprint('chatbot', __name__)

# Auto-categorization function
def auto_categorize_complaint(description):
    # Define keyword patterns for each category
    categories = {
        'hardware': [
            r'\b(hardware|device|computer|laptop|desktop|monitor|keyboard|mouse|printer|scanner|headphone|speaker|microphone|camera|webcam|usb|hdmi|vga|port|cable|adapter|charger|battery|power|screen|display|broken|physical|damage)\b',
        ],
        'software': [
            r'\b(software|program|application|app|install|uninstall|update|upgrade|download|windows|mac|os|operating system|microsoft|office|word|excel|powerpoint|outlook|browser|chrome|firefox|edge|safari|antivirus|virus|malware|bug|crash|freeze|hang|error|blue screen|bsod)\b',
        ],
        'network': [
            r'\b(network|internet|wifi|wi-fi|wireless|ethernet|connection|disconnect|slow|speed|router|modem|access point|ip|dns|vpn|proxy|firewall|server|intranet|lan|wan|ping|packet|bandwidth)\b',
        ],
        'service': [
            r'\b(service|account|login|password|reset|access|permission|role|user|profile|subscription|plan|upgrade|downgrade|cancel|renew|support|help|assistance|guide|tutorial|training)\b',
        ],
        'billing': [
            r'\b(billing|payment|invoice|charge|fee|cost|price|subscription|plan|credit|debit|card|transaction|receipt|refund|discount|coupon|promo|promotion|offer|tax)\b',
        ]
    }
    
    # Calculate scores for each category
    scores = {category: 0 for category in categories}
    
    for category, patterns in categories.items():
        for pattern in patterns:
            matches = re.findall(pattern, description.lower())
            scores[category] += len(matches)
    
    # Find the category with the highest score
    max_score = 0
    best_category = 'other'  # Default category
    
    for category, score in scores.items():
        if score > max_score:
            max_score = score
            best_category = category
    
    return best_category

# Auto-priority determination function
def auto_determine_priority(description):
    # Define keyword patterns for each priority level with weights
    priorities = {
        'urgent': {
            'patterns': [
                r'\b(urgent|emergency|immediate|critical|severe|serious|asap|now|cannot work|completely|broken|down|outage|security breach|data loss|breach|hack|compromised|stolen|fraud|urgent|emergency|fire|disaster|life-threatening|safety|danger|hazard)\b',
            ],
            'weight': 3
        },
        'high': {
            'patterns': [
                r'\b(high|important|significant|major|affecting|multiple users|team|department|deadline|soon|tomorrow|production|customer facing|revenue|money|financial|payment|billing|error|loss|damage|corrupted|missing|deleted)\b',
            ],
            'weight': 2
        },
        'medium': {
            'patterns': [
                r'\b(medium|moderate|average|standard|normal|regular|common|usual|typical|general|minor issue|inconvenience|slow|delay|wait|occasional|intermittent)\b',
            ],
            'weight': 1
        },
        'low': {
            'patterns': [
                r'\b(low|minor|trivial|small|tiny|cosmetic|visual|aesthetic|appearance|suggestion|improvement|enhance|feature request|when possible|whenever|at your convenience|not urgent|can wait)\b',
            ],
            'weight': 1
        }
    }
    
    # Calculate weighted scores for each priority
    scores = {priority: 0 for priority in priorities}
    
    for priority, info in priorities.items():
        for pattern in info['patterns']:
            matches = re.findall(pattern, description.lower())
            scores[priority] += len(matches) * info['weight']
    
    # Find the priority with the highest score
    max_score = 0
    best_priority = 'medium'  # Default priority
    
    for priority, score in scores.items():
        if score > max_score:
            max_score = score
            best_priority = priority
    
    return best_priority

# Load YOLOv8 model
model = None

# Initialize Gemini API
def initialize_gemini():
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key or api_key == 'your_gemini_api_key_here':
        print("Warning: Gemini API key not set or using default value")
        return None
    
    try:
        genai.configure(api_key=api_key)
        # Use the correct model name for the current API version
        return genai.GenerativeModel('gemini-2.5-flash')
    except Exception as e:
        print(f"Error initializing Gemini API: {e}")
        return None

# Initialize Gemini model
gemini_model = None

def load_model():
    global model, gemini_model
    # Temporarily disable YOLO model loading
    # if model is None:
    #     try:
    #         model = YOLO('yolov8n.pt')  # Load the small model version for faster inference
    #     except Exception as e:
    #         print(f"Error loading YOLO model: {e}")
    #         return None
    
    # Initialize Gemini model if not already initialized
    if gemini_model is None:
        gemini_model = initialize_gemini()
    
    # Return True instead of model since we're not loading YOLO
    return True

# Function to process text with Gemini API
def process_with_gemini(message):
    global gemini_model
    
    # Initialize Gemini model if not already initialized
    if gemini_model is None:
        gemini_model = initialize_gemini()
    
    # If Gemini API is not available, fall back to keyword-based processing
    if gemini_model is None:
        return None
    
    try:
        # Define system prompt to guide Gemini's responses
        system_prompt = """You are GrievAI, an AI assistant for a Complaint Management System used by staff and residents to report issues.

ORGANIZATION INFO: This system handles grievances for an organization. Users file complaints, track tickets, and get support.
COMPLAINT CATEGORIES: hardware, software, network, service, billing, electrical, plumbing, maintenance, cleaning, security, facility, other
TICKET PRIORITIES: low, medium, high, urgent
KEY PAGES: /dashboard (user's tickets), /profile (user profile)

INTENT VALUES:
- complaint: User reports a problem, malfunction, or wants to raise/file a formal complaint
- inquiry: User asks who you are, how things work, what categories exist, how to register, etc.
- feedback: User gives opinions, suggestions, or ratings
- navigation: User asks for links or where to find something
- general: Greetings, thank you, yes/no responses

RULES (follow strictly):
1. Give SPECIFIC, HELPFUL responses. Never give vague one-liners.
2. "who are you" "what are you" "how do you work" -> explain GrievAI role, list capabilities with bullet points.
3. "categories" "what types" -> list all complaint categories with descriptions.
4. "how to register" "how to raise" -> give step-by-step guide.
5. "dashboard" "link" "where" -> provide /dashboard and /profile links.
6. "status of my ticket" "track my ticket" "where is my complaint" "my ticket" -> explain how to check status from /dashboard, list possible statuses (Pending/In Progress/Escalated/Resolved), offer to help if they share a ticket number.
7. Any issue reported (WiFi, room, equipment, water, electricity, etc.) -> suggestTicket: true, extract details into ticketData.
8. Respond ONLY with valid JSON. No markdown. No code fences. No text outside JSON.

JSON FORMAT:
{"intent": "complaint|inquiry|feedback|navigation|general", "message": "Your helpful response (use newlines with \\n)", "suggestTicket": false, "ticketData": {"subject": "...", "description": "...", "category": "...", "priority": "..."}}

Only include ticketData when suggestTicket is true."""


        
        # Generate response using Gemini
        response = gemini_model.generate_content(
            f"{system_prompt}\n\nUser message: {message}",
            generation_config={
                "temperature": 0.3,
                "top_p": 0.9,
                "top_k": 40,
                "max_output_tokens": 1024,
            }
        )
        
        # Parse the response
        try:
            import json
            import re as re_module
            response_text = response.text.strip()
            # Strip markdown code blocks if present
            response_text = re_module.sub(r'^```(?:json)?\s*', '', response_text)
            response_text = re_module.sub(r'\s*```$', '', response_text)
            response_text = response_text.strip()
            return json.loads(response_text)
        except json.JSONDecodeError:
            print(f"Error parsing Gemini response as JSON: {response.text}")
            # Try to extract JSON from the response
            try:
                import json, re as re_module
                json_match = re_module.search(r'\{.*\}', response.text, re_module.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
            except:
                pass
            return {
                "intent": "general",
                "message": response.text,
                "suggestTicket": False
            }
    except Exception as e:
        print(f"Error processing with Gemini: {e}")
        return None

@chatbot_bp.route('/process-text', methods=['POST'])
@token_required
def process_text(current_user):
    data = request.get_json()
    
    if 'message' not in data or not data['message'].strip():
        return jsonify({'error': 'Message is required'}), 400
    
    message = data['message']
    
    # Try processing with Gemini first
    gemini_response = process_with_gemini(message)
    
    if gemini_response:
        return jsonify(gemini_response)
    
    # Fall back to keyword-based processing if Gemini fails
    # Simple keyword-based intent detection
    keywords = {
        'complaint': ['complaint', 'issue', 'problem', 'broken', 'not working', 'faulty', 'damaged'],
        'inquiry': ['how to', 'what is', 'where is', 'when', 'why', 'who', 'information', 'help'],
        'feedback': ['feedback', 'suggestion', 'improve', 'better', 'recommend']
    }
    
    # Determine intent
    intent = 'general'
    for key, words in keywords.items():
        if any(word in message.lower() for word in words):
            intent = key
            break
    
    # Generate response based on intent
    if intent == 'complaint':
        # Extract potential category
        categories = ['hardware', 'software', 'network', 'service', 'billing', 'other']
        detected_category = 'other'
        
        for category in categories:
            if category in message.lower():
                detected_category = category
                break
        
        # Generate ticket creation suggestion
        response = {
            'message': "I understand you're experiencing an issue. Would you like to create a formal complaint ticket?",
            'intent': 'complaint',
            'suggestTicket': True,
            'ticketData': {
                'subject': message[:50] + ('...' if len(message) > 50 else ''),
                'description': message,
                'category': detected_category,
                'priority': 'medium'
            }
        }
    elif intent == 'inquiry':
        response = {
            'message': "I'd be happy to help with your inquiry. Let me provide some information.",
            'intent': 'inquiry',
            'suggestTicket': False,
            'faq': {
                'title': 'Frequently Asked Questions',
                'items': [
                    {'question': 'How do I track my complaint?', 'answer': 'You can track your complaint in the dashboard under the "My Complaints" section.'},
                    {'question': 'How long does resolution take?', 'answer': 'Resolution time depends on the complexity of the issue, but we aim to resolve most complaints within 48-72 hours.'},
                    {'question': 'Can I update my complaint?', 'answer': 'Yes, you can add comments to your complaint from the complaint detail page.'}
                ]
            }
        }
    elif intent == 'feedback':
        response = {
            'message': "Thank you for your feedback! We appreciate your input to help us improve our services.",
            'intent': 'feedback',
            'suggestTicket': False
        }
    else:
        response = {
            'message': "Hello! How can I assist you today? You can report a complaint, ask for information, or provide feedback.",
            'intent': 'general',
            'suggestTicket': False
        }
    
    return jsonify(response)

@chatbot_bp.route('/process-voice', methods=['POST'])
@token_required
def process_voice(current_user):
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    audio_file = request.files['audio']
    
    # Create a temporary file to save the audio
    with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp_audio:
        audio_file.save(temp_audio.name)
        temp_audio_path = temp_audio.name
    
    try:
        # Convert webm to wav using pydub
        audio = AudioSegment.from_file(temp_audio_path, format="webm")
        wav_path = temp_audio_path.replace('.webm', '.wav')
        audio.export(wav_path, format="wav")
        
        # Use speech recognition to convert audio to text
        recognizer = sr.Recognizer()
        with sr.AudioFile(wav_path) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data)
        
        # Clean up temporary files
        os.remove(temp_audio_path)
        os.remove(wav_path)
        
        # Process the transcribed text
        if not text or text.strip() == '':
            return jsonify({
                'error': 'Could not transcribe audio. Please try again or type your message.',
                'transcribed': False
            }), 400
        
        return jsonify({
            'message': 'Audio processed successfully',
            'transcribedText': text,
            'transcribed': True
        })
    
    except Exception as e:
        # Clean up temporary files in case of error
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)
        if os.path.exists(temp_audio_path.replace('.webm', '.wav')):
            os.remove(temp_audio_path.replace('.webm', '.wav'))
        
        print(f"Error processing audio: {e}")
        return jsonify({
            'error': f'Error processing audio: {str(e)}',
            'transcribed': False
        }), 500

@chatbot_bp.route('/transcribe', methods=['POST'])
@token_required
def transcribe_audio(current_user):
    """
    Receive an audio blob (WebM/WAV) from the frontend MediaRecorder,
    send it to Gemini for transcription, return the transcript text.
    """
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audio']
    audio_bytes = audio_file.read()

    if not audio_bytes or len(audio_bytes) < 100:
        return jsonify({'error': 'Audio file is empty or too short'}), 400

    # Determine MIME type
    filename = audio_file.filename or 'recording.webm'
    ext = os.path.splitext(filename)[1].lower()
    mime_map = {
        '.webm': 'audio/webm',
        '.wav':  'audio/wav',
        '.mp3':  'audio/mpeg',
        '.ogg':  'audio/ogg',
        '.m4a':  'audio/mp4',
    }
    mime_type = mime_map.get(ext, audio_file.content_type or 'audio/webm')

    # Ensure Gemini is ready
    global gemini_model
    if gemini_model is None:
        gemini_model = initialize_gemini()

    if not gemini_model:
        return jsonify({'error': 'Transcription service not configured. Set GEMINI_API_KEY in .env'}), 503

    try:
        audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')

        response = gemini_model.generate_content([
            {
                "inline_data": {
                    "mime_type": mime_type,
                    "data": audio_b64
                }
            },
            (
                "You are a transcription assistant. "
                "Transcribe the spoken words in this audio recording exactly as said. "
                "Return ONLY the transcribed text — no labels, no commentary, no quotes. "
                "If the audio is silent or inaudible, return exactly: [inaudible]"
            )
        ])

        transcript = response.text.strip() if response.text else ''

        if not transcript or transcript.lower() == '[inaudible]':
            return jsonify({'error': 'Could not detect speech in the recording. Please speak clearly and try again.'}), 422

        return jsonify({'transcript': transcript})

    except Exception as e:
        print(f"[transcribe] Gemini error: {e}")
        return jsonify({'error': f'Transcription failed: {str(e)}'}), 500


@chatbot_bp.route('/process-image', methods=['POST'])
@token_required
def process_image(current_user):
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    image_file = request.files['image']
    db = current_app.config['db']

    # Read image bytes and encode as Base64
    image_bytes = image_file.read()
    if not image_bytes:
        return jsonify({'error': 'Empty image file'}), 400

    # Detect MIME type from filename extension
    ext = os.path.splitext(image_file.filename or '')[1].lower()
    mime_map = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
                '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp'}
    content_type = mime_map.get(ext, 'image/jpeg')

    # Store image in MongoDB images collection
    image_doc = {
        'data': base64.b64encode(image_bytes).decode('utf-8'),
        'content_type': content_type,
        'filename': image_file.filename or f'upload{ext}',
        'uploaded_by': current_user['id'],
        'uploaded_at': datetime.utcnow(),
        'size_bytes': len(image_bytes)
    }
    result = db.images.insert_one(image_doc)
    image_id = str(result.inserted_id)
    image_url = f"/api/chatbot/image/{image_id}"

    # Optionally analyze with Gemini Vision
    image_description = None
    global gemini_model
    if gemini_model is None:
        gemini_model = initialize_gemini()

    if gemini_model:
        try:
            import PIL.Image
            import io
            img = PIL.Image.open(io.BytesIO(image_bytes))
            vision_response = gemini_model.generate_content([
                "Analyze this image briefly for a complaint management system. "
                "Describe any visible issues, damage, or problems in 1-2 sentences. "
                "If it's unclear, say so.",
                img
            ])
            image_description = vision_response.text
        except Exception as vision_err:
            print(f"Vision analysis failed: {vision_err}")

    message = image_description or (
        "I've received your image. Please describe the issue you're experiencing "
        "so I can help create a complaint ticket."
    )

    return jsonify({
        'message': message,
        'detectedObjects': [],
        'imageUrl': image_url,
        'suggestTicket': True
    })


@chatbot_bp.route('/image/<image_id>', methods=['GET'])
def serve_image(image_id):
    """Serve an image stored in MongoDB by its ObjectId."""
    from flask import make_response
    db = current_app.config['db']
    try:
        image_doc = db.images.find_one({'_id': ObjectId(image_id)})
    except Exception:
        return jsonify({'error': 'Invalid image ID'}), 400

    if not image_doc:
        return jsonify({'error': 'Image not found'}), 404

    image_bytes = base64.b64decode(image_doc['data'])
    response = make_response(image_bytes)
    response.headers['Content-Type'] = image_doc.get('content_type', 'image/jpeg')
    response.headers['Content-Length'] = len(image_bytes)
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Cache-Control'] = 'public, max-age=86400'
    return response


@chatbot_bp.route('/message', methods=['POST'])
@token_required
def process_message(current_user):
    data = request.get_json()
    
    if 'message' not in data or not data['message'].strip():
        return jsonify({'error': 'Message is required'}), 400
    
    message = data['message']
    
    # Process with Gemini or fallback to keyword-based processing
    gemini_response = process_with_gemini(message)
    
    if gemini_response:
        return jsonify(gemini_response)
    
    # If Gemini fails, use a comprehensive rule-based fallback
    msg_lower = message.lower().strip()

    # ── Ticket status / tracking questions ─────────────────────────────────────
    status_words = ['status of my ticket', 'status of my complaint', 'track my ticket',
                    'track my complaint', 'where is my ticket', 'where is my complaint',
                    'my ticket status', 'my complaint status', 'check my ticket',
                    'check my complaint', 'ticket update', 'complaint update',
                    'what happened to my complaint', 'any update on my ticket',
                    'status of my', 'track my', 'my ticket', 'ticket #', 'ticket number']
    if any(phrase in msg_lower for phrase in status_words):
        return jsonify({
            'message': (
                "You can track the status of your tickets from your **Dashboard**.\n\n"
                "Here's how:\n"
                "1. Go to your [Dashboard](/dashboard)\n"
                "2. Find your ticket in the **Your Complaints** list\n"
                "3. Click on the ticket to see its full details, status, and any updates\n\n"
                "**Possible statuses:**\n"
                "- **Pending** — Ticket received, waiting to be assigned\n"
                "- **In Progress** — A worker has been assigned and is working on it\n"
                "- **Escalated** — Raised to admin for priority handling\n"
                "- **Resolved** — Issue has been fixed\n\n"
                "If you need urgent help, please share your ticket number and I'll check for you."
            ),
            'intent': 'inquiry',
            'suggestTicket': False,
            'options': [
                {'id': 'open_ticket', 'text': 'Raise a New Complaint'},
            ]
        })

    # Helper: detect complaint keywords
    complaint_words = ['complaint', 'issue', 'problem', 'broken', 'not working', 'faulty',
                       'damaged', 'bug', 'error', 'failed', 'outage', 'crash', 'slow',
                       'wrong', 'incorrect', 'missing', 'damaged', 'urgent', 'not received',
                       'room', 'bulb', 'wifi', 'internet', 'water', 'electricity', 'lift',
                       'ac', 'air conditioner', 'toilet', 'leak', 'noise', 'smell', 'dirty']


    # Helper: detect inquiry keywords
    identity_words = ['who are you', 'what are you', 'who is this', 'what is griev',
                      'tell me about yourself', 'introduce yourself', 'your name',
                      'what can you do', 'how do you work', 'how does this work',
                      'how does griev', 'explain yourself', 'what is this',
                      'what is this system', 'your organization', 'which company']
    
    navigation_words = ['dashboard', 'link', 'where to', 'where can i', 'how to go',
                        'navigate', 'page', 'portal', 'login', 'signup', 'register']
    
    category_words = ['categories', 'category', 'types of complaint', 'what kinds',
                      'what type', 'options', 'list of', 'available categories']
    
    how_to_words = ['how to', 'how do i', 'how can i', 'how to register', 'how to raise',
                    'how to submit', 'how to create', 'how to file', 'how to track',
                    'how to check', 'how to update', 'how to cancel', 'guide me',
                    'help me', 'step by step', 'what should i', 'tell me how']
    
    feedback_words = ['feedback', 'suggestion', 'improve', 'better', 'recommend',
                      'rate', 'review', 'opinion', 'thoughts', 'experience']
    
    # Check identity/intro
    if any(phrase in msg_lower for phrase in identity_words):
        return jsonify({
            'message': (
                "I'm **Griev AI** 🤖, your intelligent grievance management assistant for this organization.\n\n"
                "I can help you with:\n"
                "• 📋 **Raise a complaint** — describe your issue and I'll create a ticket\n"
                "• 🔍 **Track ticket status** — ask about the status of your complaints\n"
                "• ❓ **Answer questions** — about the complaint process, categories, and resolution times\n"
                "• 📸 **Image upload** — share a photo of the issue for better analysis\n"
                "• 🎤 **Voice input** — speak your complaint directly\n\n"
                "Just tell me what's bothering you, and I'll take care of the rest!"
            ),
            'intent': 'info',
            'suggestTicket': False
        })
    
    # Check categories question
    if any(phrase in msg_lower for phrase in category_words):
        return jsonify({
            'message': (
                "We handle the following complaint categories:\n\n"
                "🔧 **Hardware** — physical device issues (computers, printers, phones)\n"
                "💻 **Software** — app/system issues, bugs, crashes\n"
                "🌐 **Network** — internet, WiFi, VPN connectivity issues\n"
                "📋 **Service** — account, access, process-related issues\n"
                "💳 **Billing** — payment, invoice, or subscription issues\n"
                "🏠 **Facility** — room/building issues (electricity, plumbing, AC, etc.)\n"
                "🔒 **Security** — safety or security-related concerns\n"
                "📦 **Other** — anything else\n\n"
                "Which category fits your issue? Or just describe your problem!"
            ),
            'intent': 'info',
            'suggestTicket': False,
            'options': [
                {'id': 'open_ticket', 'text': '📋 Raise a Complaint'},
            ]
        })
    
    # Check how-to / registration questions
    if any(phrase in msg_lower for phrase in how_to_words):
        return jsonify({
            'message': (
                "Here's how to register a complaint:\n\n"
                "1️⃣ **Describe your issue** here in the chat (e.g., 'The WiFi in room 204 is not working')\n"
                "2️⃣ I'll **analyze** your message and suggest a ticket with the right category and priority\n"
                "3️⃣ **Confirm** to create the ticket — you'll get a ticket number instantly\n"
                "4️⃣ **Track** your ticket from your [Dashboard](/dashboard)\n\n"
                "You can also go directly to the **New Complaint** form in your dashboard.\n\n"
                "Ready? Just describe your issue and I'll get started! 🚀"
            ),
            'intent': 'info',
            'suggestTicket': False,
            'options': [
                {'id': 'open_ticket', 'text': '📋 Raise a Complaint Now'},
            ]
        })
    
    # Check navigation questions
    if any(phrase in msg_lower for phrase in navigation_words):
        return jsonify({
            'message': (
                "Here are the key pages you can access:\n\n"
                "🏠 **Dashboard** — [Go to Dashboard](/dashboard) — view all your tickets\n"
                "📋 **New Complaint** — describe it here or click the button below\n"
                "👤 **Profile** — [View Profile](/profile) — update your details\n\n"
                "Is there a specific page you're looking for?"
            ),
            'intent': 'navigation',
            'suggestTicket': False,
            'options': [
                {'id': 'open_ticket', 'text': '📋 Raise a Complaint'},
            ]
        })
    
    # Check feedback
    if any(word in msg_lower for word in feedback_words):
        return jsonify({
            'message': (
                "Thank you for wanting to share feedback! 😊\n\n"
                "You can submit formal feedback via the **Feedback** button in your dashboard.\n\n"
                "Alternatively, just tell me your feedback here and I can help document it."
            ),
            'intent': 'feedback',
            'suggestTicket': False
        })
    
    # Check complaint keywords
    is_complaint = any(word in msg_lower for word in complaint_words)
    if is_complaint:
        detected_category = auto_categorize_complaint(message)
        detected_priority = auto_determine_priority(message)
        subject = message[:60] + ('...' if len(message) > 60 else '')

        return jsonify({
            'message': "I understand you're experiencing an issue. Let me help you create a formal complaint ticket.",
            'intent': 'complaint',
            'suggestTicket': True,
            'ticketData': {
                'subject': subject,
                'description': message,
                'category': detected_category,
                'priority': detected_priority
            }
        })
    
    # Generic helpful response — better than "Hello! How can I assist..."
    return jsonify({
        'message': (
            "I'm here to help! Here's what I can do for you:\n\n"
            "📋 **Raise a complaint** — describe any issue (equipment, room, service, etc.)\n"
            "🔍 **Track your tickets** — ask about the status of any complaint\n"
            "❓ **Answer questions** — about the complaint process or categories\n\n"
            "Just tell me what you need!"
        ),
        'intent': 'general',
        'suggestTicket': False,
        'options': [
            {'id': 'open_ticket', 'text': '📋 Raise a Complaint'},
        ]
    })



@chatbot_bp.route('/create-ticket', methods=['POST'])
@token_required
def create_ticket(current_user):
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ('subject', 'description', 'category')):
        return jsonify({'error': 'Missing required fields'}), 400
    
    db = current_app.config['db']
    
    # Get user details
    user = db.users.find_one({'_id': ObjectId(current_user['id'])})
    
    # Auto-categorize if needed
    category = data['category']
    if category == 'general' or category == 'other':
        # Attempt to auto-categorize based on description
        category = auto_categorize_complaint(data['description'])
    
    # Determine priority if not provided or enhance existing priority
    priority = data.get('priority', 'medium')
    if priority == 'medium':
        # Attempt to determine priority based on description
        priority = auto_determine_priority(data['description'])
    
    # Create complaint document
    complaint = {
        'subject': data['subject'],
        'description': data['description'],
        'category': category,
        'status': 'pending',
        'priority': priority,
        'user_id': ObjectId(current_user['id']),
        'user': {
            'name': user['name'],
            'email': user['email'],
            'phone': user.get('phone')  # Include phone if available
        },
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow(),
        'comments': [],
        'imageUrl': data.get('imageUrl'),
        'detectedObjects': data.get('detectedObjects', [])
    }
    
    # Insert complaint into database
    result = db.complaints.insert_one(complaint)
    complaint_id = result.inserted_id
    
    # Send notification to user about ticket creation
    notification_result = send_ticket_creation_notification(
        user_email=user['email'],
        user_name=user['name'],
        ticket_id=str(complaint_id),
        subject=data['subject'],
        category=category,
        priority=priority
    )
    
    return jsonify({
        'message': 'Ticket created successfully',
        'ticketId': str(complaint_id),
        'ticketNumber': str(complaint_id)[-6:].upper(),  # Generate a shorter ticket number for display
        'notifications': notification_result
    })

@chatbot_bp.route('/issue-solved', methods=['POST'])
@token_required
def issue_solved(current_user):
    """
    Handle when a user indicates their issue is solved and send thank you notifications
    """
    db = current_app.config['db']
    
    # Get user details
    user = db.users.find_one({'_id': ObjectId(current_user['id'])})
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Send thank you notifications
    notification_result = send_thank_you_notifications(
        user_email=user['email'],
        user_phone=user.get('phone')  # Send WhatsApp if phone is available
    )
    
    return jsonify({
        'message': 'Thank you for using our service!',
        'notifications': notification_result,
        'showThankYouPopup': True
    })