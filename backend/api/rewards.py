from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
from datetime import datetime
from utils.auth_middleware import token_required, admin_required
from utils.rewards import award_points, get_user_rewards, get_user_level, get_reward_levels

rewards_bp = Blueprint('rewards', __name__)

@rewards_bp.route('/user', methods=['GET'])
@token_required
def get_user_reward_info(current_user):
    """
    Get the current user's reward information
    """
    # Get user rewards history
    rewards_history = get_user_rewards(current_user['id'])
    
    # Get user level information
    level_info = get_user_level(current_user['id'])
    
    # Combine the information
    reward_info = {
        'total_points': rewards_history.get('total_points', 0),
        'rewards': rewards_history.get('rewards', []),
        'current_level': level_info.get('current_level'),
        'next_level': level_info.get('next_level'),
        'points_to_next_level': level_info.get('points_to_next_level')
    }
    
    return jsonify(reward_info)

@rewards_bp.route('/levels', methods=['GET'])
def get_available_reward_levels():
    """
    Get all available reward levels
    """
    levels = get_reward_levels()
    return jsonify(levels)

@rewards_bp.route('/leaderboard', methods=['GET'])
def get_rewards_leaderboard():
    """
    Get the rewards leaderboard
    """
    db = current_app.config['db']
    
    # Get top users by reward points
    top_users = list(db.users.find(
        {'reward_points': {'$exists': True, '$gt': 0}},
        {'_id': 1, 'name': 1, 'email': 1, 'reward_points': 1}
    ).sort('reward_points', -1).limit(10))
    
    # Format users for response
    formatted_users = []
    for i, user in enumerate(top_users):
        # Get user level
        level_info = get_user_level(user['_id'])
        
        formatted_users.append({
            'rank': i + 1,
            'id': str(user['_id']),
            'name': user['name'],
            'email': user['email'],
            'points': user.get('reward_points', 0),
            'level': level_info.get('current_level', {}).get('level', 'Bronze')
        })
    
    return jsonify(formatted_users)

@rewards_bp.route('/award', methods=['POST'])
@admin_required
def admin_award_points(current_user):
    """
    Admin endpoint to manually award points to a user
    """
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ('user_id', 'points', 'reason')):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        db = current_app.config['db']
        
        # Convert user_id to ObjectId
        try:
            user_id = ObjectId(data['user_id'])
        except Exception as e:
            return jsonify({'error': f'Invalid user ID format: {str(e)}'}), 400
        
        # Get user
        user = db.users.find_one({'_id': user_id})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        points = int(data['points'])
        reason = data['reason']
        
        # Create reward entry
        reward_entry = {
            'user_id': user_id,
            'points': points,
            'action_type': 'admin_award',
            'timestamp': datetime.utcnow(),
            'description': reason,
            'awarded_by': ObjectId(current_user['id'])
        }
        
        # Add complaint_id if provided
        if 'complaint_id' in data and data['complaint_id']:
            try:
                reward_entry['complaint_id'] = ObjectId(data['complaint_id'])
            except:
                # If complaint_id is invalid, just don't include it
                pass
        
        # Insert reward entry
        result = db.rewards.insert_one(reward_entry)
        
        # Update user's total points
        current_points = user.get('reward_points', 0)
        new_total = current_points + points
        
        db.users.update_one(
            {'_id': user_id},
            {'$set': {'reward_points': new_total}}
        )
        
        # Send notification email to user about the reward
        from utils.notifications import send_email
        try:
            send_email(
                recipient_email=user['email'],
                subject=f"🎉 You've earned {points} reward points!",
                body=f"Congratulations! You have been awarded {points} points by an administrator.\n\nReason: {reason}\n\nYour new total: {new_total} points",
                html=f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4f46e5;">🎉 Reward Points Awarded!</h2>
                    <p>Congratulations {user['name']}!</p>
                    <p>You have been awarded <strong>{points} points</strong> by an administrator.</p>
                    <p><strong>Reason:</strong> {reason}</p>
                    <p><strong>Your new total:</strong> {new_total} points</p>
                    <p>Keep up the great work!</p>
                </div>
                """
            )
        except Exception as email_error:
            print(f"Failed to send reward notification email: {email_error}")
        
        return jsonify({
            'awarded': True,
            'success': True,
            'user_id': str(user_id),
            'user_name': user['name'],
            'points': points,
            'total_points': new_total,
            'message': f"Successfully awarded {points} points to {user['name']}",
            'reward_id': str(result.inserted_id)
        })
        
    except Exception as e:
        print(f"Error awarding points: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500