from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
from utils.auth_middleware import token_required
from utils.rewards import award_points

feedback_bp = Blueprint('feedback', __name__)

@feedback_bp.route('/', methods=['POST'])
@token_required
def submit_feedback(current_user):
    """
    Submit user feedback and award points
    """
    data = request.get_json()
    
    # Validate required fields
    if not data.get('message'):
        return jsonify({'error': 'Feedback message is required'}), 400
    
    db = current_app.config['db']
    
    # Create feedback document
    feedback = {
        'user_id': current_user['id'],
        'user_name': current_user.get('name', 'Unknown'),
        'user_email': current_user.get('email', ''),
        'message': data['message'],
        'type': data.get('type', 'general'),  # general, bug, feature, complaint
        'rating': data.get('rating'),  # Optional rating 1-5
        'createdAt': datetime.utcnow(),
        'status': 'submitted'
    }
    
    # Insert feedback into database
    result = db.feedback.insert_one(feedback)
    feedback_id = result.inserted_id
    
    # Award points for providing feedback
    reward_result = award_points(current_user['id'], 'feedback')
    
    response = {
        'feedback_id': str(feedback_id),
        'message': 'Feedback submitted successfully',
        'awarded_points': reward_result.get('points', 0) if reward_result.get('awarded', False) else 0
    }
    
    return jsonify(response), 201

@feedback_bp.route('/', methods=['GET'])
@token_required
def get_user_feedback(current_user):
    """
    Get feedback submitted by the current user
    """
    db = current_app.config['db']
    
    # Get user's feedback
    user_feedback = list(db.feedback.find({'user_id': current_user['id']}).sort('createdAt', -1))
    
    # Format feedback for response
    formatted_feedback = []
    for feedback in user_feedback:
        formatted_feedback.append({
            'id': str(feedback['_id']),
            'message': feedback['message'],
            'type': feedback.get('type', 'general'),
            'rating': feedback.get('rating'),
            'status': feedback.get('status', 'submitted'),
            'createdAt': feedback['createdAt'].isoformat()
        })
    
    print(f"Retrieved user feedback for user {current_user['id']}: {formatted_feedback}")
    return jsonify(formatted_feedback)

@feedback_bp.route('/admin', methods=['GET'])
@token_required
def get_all_feedback(current_user):
    """
    Get all feedback (admin only)
    """
    # Check if user is admin
    if not current_user.get('is_admin'):
        return jsonify({'error': 'Admin access required'}), 403
    
    db = current_app.config['db']
    
    # Get all feedback
    all_feedback = list(db.feedback.find().sort('createdAt', -1))
    
    # Format feedback for response
    formatted_feedback = []
    for feedback in all_feedback:
        formatted_feedback.append({
            'id': str(feedback['_id']),
            'user_name': feedback.get('user_name', 'Unknown'),
            'user_email': feedback.get('user_email', ''),
            'message': feedback['message'],
            'type': feedback.get('type', 'general'),
            'rating': feedback.get('rating'),
            'status': feedback.get('status', 'submitted'),
            'createdAt': feedback['createdAt'].isoformat()
        })
    
    return jsonify(formatted_feedback) 