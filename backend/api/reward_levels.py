from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
from datetime import datetime
from utils.auth_middleware import admin_required

reward_levels_bp = Blueprint('reward_levels', __name__)

@reward_levels_bp.route('/levels', methods=['GET'])
def get_reward_levels():
    """
    Get all reward levels (public endpoint)
    """
    try:
        db = current_app.config['db']
        
        # Try to get levels from database first
        levels = list(db.reward_levels.find().sort('min_points', 1))
        
        # If no levels in database, create default ones
        if not levels:
            default_levels = [
                {
                    'level': 'Rookie Support Agent',
                    'min_points': 0,
                    'max_points': 99,
                    'benefits': ['Basic support access', 'Welcome badge'],
                    'requirements': ['Complete registration', 'Submit first feedback'],
                    'badge_color': '#95a5a6',
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                },
                {
                    'level': 'Support Specialist',
                    'min_points': 100,
                    'max_points': 299,
                    'benefits': ['Priority support', 'Monthly training', 'Specialist badge'],
                    'requirements': ['Earn 100 points', 'Submit 5 feedbacks', 'Maintain 4+ star average'],
                    'badge_color': '#3498db',
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                },
                {
                    'level': 'Senior Support Specialist',
                    'min_points': 300,
                    'max_points': 599,
                    'benefits': ['Priority support', 'Monthly training', 'Exclusive webinars', 'Senior badge'],
                    'requirements': ['Earn 300 points', 'Complete 10 tickets', 'Help 5 other users'],
                    'badge_color': '#9b59b6',
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                },
                {
                    'level': 'Support Expert',
                    'min_points': 600,
                    'max_points': 999,
                    'benefits': ['VIP support', 'Monthly training', 'Exclusive webinars', 'Early feature access', 'Expert badge'],
                    'requirements': ['Earn 600 points', 'Resolve 20 tickets', 'Mentor new users'],
                    'badge_color': '#e67e22',
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                },
                {
                    'level': 'Support Master',
                    'min_points': 1000,
                    'max_points': float('inf'),
                    'benefits': ['VIP support', 'Monthly training', 'Exclusive webinars', 'Early feature access', 'Recognition program', 'Master badge'],
                    'requirements': ['Earn 1000 points', 'Complete 50 tickets', 'Lead community initiatives'],
                    'badge_color': '#f39c12',
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
            ]
            
            # Insert default levels
            db.reward_levels.insert_many(default_levels)
            levels = default_levels
        
        # Format levels for response
        formatted_levels = []
        for level in levels:
            # Handle Infinity values properly for JSON serialization
            max_points = level['max_points']
            if max_points == float('inf'):
                max_points = None  # Use None instead of Infinity for JSON compatibility
            
            formatted_level = {
                'id': str(level.get('_id', '')),
                'level': level['level'],
                'min_points': level['min_points'],
                'max_points': max_points,
                'benefits': level['benefits'],
                'requirements': level.get('requirements', []),
                'badge_color': level.get('badge_color', '#95a5a6'),
                'description': level.get('description', ''),
                'created_at': level.get('created_at', datetime.utcnow()).isoformat() if level.get('created_at') else None,
                'updated_at': level.get('updated_at', datetime.utcnow()).isoformat() if level.get('updated_at') else None
            }
            formatted_levels.append(formatted_level)
        
        return jsonify(formatted_levels)
        
    except Exception as e:
        print(f"Error getting reward levels: {str(e)}")
        return jsonify({'error': str(e)}), 500

@reward_levels_bp.route('/levels', methods=['POST'])
@admin_required
def create_reward_level(current_user):
    """
    Create a new reward level (admin only)
    """
    try:
        data = request.get_json()
        db = current_app.config['db']
        
        # Validate required fields
        required_fields = ['level', 'min_points', 'max_points', 'benefits']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Create level document
        max_points = data['max_points']
        if max_points is None or max_points == 'inf':
            max_points = float('inf')
        else:
            max_points = int(max_points)
            
        level = {
            'level': data['level'],
            'min_points': int(data['min_points']),
            'max_points': max_points,
            'benefits': data['benefits'] if isinstance(data['benefits'], list) else [data['benefits']],
            'requirements': data.get('requirements', []),
            'badge_color': data.get('badge_color', '#95a5a6'),
            'description': data.get('description', ''),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'created_by': current_user['id']
        }
        
        # Insert level
        result = db.reward_levels.insert_one(level)
        
        return jsonify({
            'success': True,
            'message': 'Reward level created successfully',
            'level_id': str(result.inserted_id)
        }), 201
        
    except Exception as e:
        print(f"Error creating reward level: {str(e)}")
        return jsonify({'error': str(e)}), 500

@reward_levels_bp.route('/levels/<level_id>', methods=['PUT'])
@admin_required
def update_reward_level(current_user, level_id):
    """
    Update an existing reward level (admin only)
    """
    try:
        data = request.get_json()
        db = current_app.config['db']
        
        # Validate level_id
        try:
            level_obj_id = ObjectId(level_id)
        except:
            return jsonify({'error': 'Invalid level ID'}), 400
        
        # Check if level exists
        existing_level = db.reward_levels.find_one({'_id': level_obj_id})
        if not existing_level:
            return jsonify({'error': 'Reward level not found'}), 404
        
        # Prepare update data
        update_data = {}
        
        if 'level' in data:
            update_data['level'] = data['level']
        if 'min_points' in data:
            update_data['min_points'] = int(data['min_points'])
        if 'max_points' in data:
            max_points = data['max_points']
            if max_points is None or max_points == 'inf':
                update_data['max_points'] = float('inf')
            else:
                update_data['max_points'] = int(max_points)
        if 'benefits' in data:
            update_data['benefits'] = data['benefits'] if isinstance(data['benefits'], list) else [data['benefits']]
        if 'requirements' in data:
            update_data['requirements'] = data['requirements'] if isinstance(data['requirements'], list) else [data['requirements']]
        if 'badge_color' in data:
            update_data['badge_color'] = data['badge_color']
        if 'description' in data:
            update_data['description'] = data['description']
        
        update_data['updated_at'] = datetime.utcnow()
        update_data['updated_by'] = current_user['id']
        
        # Update level
        result = db.reward_levels.update_one(
            {'_id': level_obj_id},
            {'$set': update_data}
        )
        
        if result.modified_count > 0:
            return jsonify({
                'success': True,
                'message': 'Reward level updated successfully'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'No changes made'
            })
        
    except Exception as e:
        print(f"Error updating reward level: {str(e)}")
        return jsonify({'error': str(e)}), 500

@reward_levels_bp.route('/levels/<level_id>', methods=['DELETE'])
@admin_required
def delete_reward_level(current_user, level_id):
    """
    Delete a reward level (admin only)
    """
    try:
        db = current_app.config['db']
        
        # Validate level_id
        try:
            level_obj_id = ObjectId(level_id)
        except:
            return jsonify({'error': 'Invalid level ID'}), 400
        
        # Check if level exists
        existing_level = db.reward_levels.find_one({'_id': level_obj_id})
        if not existing_level:
            return jsonify({'error': 'Reward level not found'}), 404
        
        # Delete level
        result = db.reward_levels.delete_one({'_id': level_obj_id})
        
        if result.deleted_count > 0:
            return jsonify({
                'success': True,
                'message': 'Reward level deleted successfully'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to delete reward level'
            })
        
    except Exception as e:
        print(f"Error deleting reward level: {str(e)}")
        return jsonify({'error': str(e)}), 500

@reward_levels_bp.route('/stats', methods=['GET'])
@admin_required
def get_reward_stats(current_user):
    """
    Get reward system statistics (admin only)
    """
    try:
        db = current_app.config['db']
        
        # Get user distribution by level
        levels = list(db.reward_levels.find().sort('min_points', 1))
        level_distribution = []
        
        for level in levels:
            min_points = level['min_points']
            max_points = level['max_points']
            
            if max_points == float('inf'):
                user_count = db.users.count_documents({
                    'reward_points': {'$gte': min_points}
                })
            else:
                user_count = db.users.count_documents({
                    'reward_points': {'$gte': min_points, '$lte': max_points}
                })
            
            level_distribution.append({
                'level': level['level'],
                'user_count': user_count,
                'min_points': min_points,
                'max_points': max_points
            })
        
        # Get total stats
        total_users = db.users.count_documents({})
        total_rewards_given = db.rewards.count_documents({})
        total_points_awarded = list(db.rewards.aggregate([
            {'$group': {'_id': None, 'total': {'$sum': '$points'}}}
        ]))
        total_points = total_points_awarded[0]['total'] if total_points_awarded else 0
        
        # Get top users
        top_users = list(db.users.find(
            {'reward_points': {'$exists': True, '$gt': 0}},
            {'name': 1, 'email': 1, 'reward_points': 1}
        ).sort('reward_points', -1).limit(10))
        
        formatted_top_users = []
        for user in top_users:
            formatted_top_users.append({
                'name': user.get('name', 'Unknown'),
                'email': user.get('email', ''),
                'points': user.get('reward_points', 0)
            })
        
        return jsonify({
            'level_distribution': level_distribution,
            'total_users': total_users,
            'total_rewards_given': total_rewards_given,
            'total_points_awarded': total_points,
            'top_users': formatted_top_users
        })
        
    except Exception as e:
        print(f"Error getting reward stats: {str(e)}")
        return jsonify({'error': str(e)}), 500