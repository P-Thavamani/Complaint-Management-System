from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
from datetime import datetime
import os
import base64
import tempfile
import speech_recognition as sr
from pydub import AudioSegment
import numpy as np
# Temporarily commenting out YOLO import to avoid CUDA errors
# from ultralytics import YOLO
import cv2
from utils.auth_middleware import token_required
import uuid
import google.generativeai as genai
from utils.notifications import send_thank_you_notifications
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
        return genai.GenerativeModel('gemini-1.5-pro')
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
        system_prompt = """
        You are an AI assistant for a complaint management system. Your role is to help users with their complaints, 
        inquiries, and feedback. Analyze the user's message and determine the intent (complaint, inquiry, feedback, or general).
        
        For complaints, identify the category (hardware, software, network, service, billing, or other) and suggest creating a ticket.
        For inquiries, provide helpful information related to the complaint system.
        For feedback, acknowledge and thank the user.
        For general messages, provide a friendly response and explain how you can help.
        
        Respond in JSON format with the following structure:
        {
            "intent": "complaint|inquiry|feedback|general",
            "message": "Your response message",
            "suggestTicket": true|false,
            "ticketData": {  // Only include if suggestTicket is true
                "subject": "Brief subject",
                "description": "Full description",
                "category": "hardware|software|network|service|billing|other",
                "priority": "low|medium|high"
            }
        }
        """
        
        # Generate response using Gemini
        response = gemini_model.generate_content(
            [
                {"role": "system", "parts": [system_prompt]},
                {"role": "user", "parts": [message]}
            ],
            generation_config={
                "temperature": 0.2,
                "top_p": 0.8,
                "top_k": 40,
                "max_output_tokens": 1024,
            }
        )
        
        # Parse the response
        try:
            # Try to parse as JSON
            import json
            response_text = response.text
            return json.loads(response_text)
        except json.JSONDecodeError:
            # If not valid JSON, extract intent and create a basic response
            print(f"Error parsing Gemini response as JSON: {response.text}")
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

@chatbot_bp.route('/process-image', methods=['POST'])
@token_required
def process_image(current_user):
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    image_file = request.files['image']
    
    # Create a temporary file to save the image
    with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_img:
        image_file.save(temp_img.name)
        temp_img_path = temp_img.name
    
    try:
        # Temporarily disabled YOLO model loading and object detection
        # Instead, we'll just save the image and return a generic response
        
        # Generate a unique filename for the uploaded image
        filename = f"{uuid.uuid4()}.jpg"
        upload_path = os.path.join('static', 'uploads', filename)
        os.makedirs(os.path.dirname(upload_path), exist_ok=True)
        
        # Save the image to the uploads directory
        with open(temp_img_path, 'rb') as src_file:
            with open(upload_path, 'wb') as dst_file:
                dst_file.write(src_file.read())
        
        # Clean up temporary file
        os.remove(temp_img_path)
        
        # Generate a generic response since we're not using object detection
        message = "I've received your image. Please provide more details about your complaint."
        suggest_ticket = True
        
        # Create image URL
        image_url = f"/static/uploads/{filename}"
        
        return jsonify({
            'message': message,
            'detectedObjects': [],  # Empty list since we're not using object detection
            'imageUrl': image_url,
            'suggestTicket': suggest_ticket
        })
    
    except Exception as e:
        # Clean up temporary file in case of error
        if os.path.exists(temp_img_path):
            os.remove(temp_img_path)
        
        print(f"Error processing image: {e}")
        return jsonify({
            'error': f'Error processing image: {str(e)}'
        }), 500

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
    
    # If Gemini processing failed, use the same logic as process-text endpoint
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
    
    return jsonify({
        'message': 'Ticket created successfully',
        'ticketId': str(complaint_id),
        'ticketNumber': str(complaint_id)[-6:].upper()  # Generate a shorter ticket number for display
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