from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
from utils.auth_middleware import token_required, admin_required
from utils.rewards import award_points
from models.complaint import Complaint
from models.feedback import Feedback
from bson import ObjectId

feedback_bp = Blueprint('feedback', __name__)

@feedback_bp.route('', methods=['POST'])
@token_required
def submit_feedback(current_user):
    """
    Submit general feedback
    """
    try:
        data = request.get_json()
        db = current_app.config['db']
        
        # Create feedback document
        feedback = {
            'user_id': current_user['id'],
            'user_name': current_user.get('name', 'Unknown'),
            'user_email': current_user.get('email', ''),
            'rating': data.get('rating', 5),
            'comment': data.get('message', ''),  # Use message from form data
            'type': data.get('type', 'general'),
            'createdAt': datetime.utcnow(),
            'status': 'submitted'
        }
        
        # Add complaint_id if provided
        if 'complaint_id' in data and data['complaint_id']:
            try:
                feedback['complaint_id'] = ObjectId(data['complaint_id'])
            except:
                pass
        
        # Insert feedback into database
        result = db.feedback.insert_one(feedback)
        
        # Award points to the user for submitting feedback
        points_awarded = 5  # Default points for feedback
        if feedback['rating'] >= 4:
            points_awarded = 10  # More points for positive feedback
        
        # Update user's reward points
        award_points(current_user['id'], points_awarded, 'Submitted feedback', db=db)
        
        return jsonify({
            'feedback_id': str(result.inserted_id),
            'message': 'Feedback submitted successfully',
            'awarded_points': points_awarded
        }), 201
        
    except Exception as e:
        print(f"Error submitting feedback: {str(e)}")
        return jsonify({'error': str(e)}), 500

@feedback_bp.route('/complaint/<complaint_id>', methods=['POST'])
@token_required
def submit_complaint_feedback(current_user, complaint_id):
    """
    Submit feedback for a resolved complaint and award points to the worker
    """
    try:
        data = request.get_json()
        db = current_app.config['db']
        
        # Verify complaint exists and belongs to user
        try:
            complaint_obj_id = ObjectId(complaint_id)
        except:
            return jsonify({'error': 'Invalid complaint ID'}), 400
            
        # Get complaint directly from database
        complaint = db.complaints.find_one({'_id': complaint_obj_id, 'user_id': current_user['id']})
        if not complaint:
            return jsonify({'error': 'Complaint not found or access denied'}), 404
            
        # Create feedback document
        feedback = {
            'complaint_id': complaint_obj_id,
            'user_id': current_user['id'],
            'user_name': current_user.get('name', 'Unknown'),
            'user_email': current_user.get('email', ''),
            'rating': data.get('rating', 5),
            'comment': data.get('comment', ''),
            'resolved': data.get('resolved', True),
            'createdAt': datetime.utcnow(),
            'status': 'submitted'
        }
        
        # Insert feedback into database
        result = db.feedback.insert_one(feedback)
        
        # Award points based on rating if complaint was assigned to a worker
        if complaint.get('assigned_to'):
            worker_id = complaint.get('assigned_to')
            if feedback['rating'] == 5:
                award_points(worker_id, 'five_star_rating', complaint_id)
            elif feedback['rating'] >= 4:
                award_points(worker_id, 'positive_feedback', complaint_id)
        
        return jsonify({
            'feedback_id': str(result.inserted_id),
            'message': 'Feedback submitted successfully'
        }), 201
        
    except Exception as e:
        print(f"Error submitting feedback: {str(e)}")
        return jsonify({'error': str(e)}), 500

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
@admin_required
def get_all_feedback(current_user):
    """
    Get all feedback (admin only)
    """
    db = current_app.config['db']
    
    # Get all feedback from database
    all_feedback = list(db.feedback.find().sort('createdAt', -1))
    
    # Format feedback for response
    formatted_feedback = [{
        'id': str(feedback['_id']),
        'complaint_id': str(feedback.get('complaint_id', '')),
        'user_id': str(feedback.get('user_id', '')),
        'user_name': feedback.get('user_name', 'Unknown'),
        'rating': feedback.get('rating', 0),
        'comment': feedback.get('comment', ''),
        'resolved': feedback.get('resolved', False),
        'createdAt': feedback.get('createdAt', datetime.utcnow()).isoformat()
    } for feedback in all_feedback]
    
    return jsonify(formatted_feedback)