from flask import current_app
from datetime import datetime
from bson.objectid import ObjectId
from utils.notifications import send_email

def award_points(user_id, action_type, complaint_id=None):
    """
    Award points to a user for various actions
    
    Args:
        user_id (str): The user's ID
        action_type (str): The type of action (create_ticket, resolved_ticket, etc.)
        complaint_id (str, optional): The complaint ID if applicable
    
    Returns:
        dict: Information about the awarded points
    """
    try:
        db = current_app.config['db']
        
        # Convert user_id to ObjectId if it's a string
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        
        # Points for different actions
        points_map = {
            # User actions
            'create_ticket': 10,      # Creating a new ticket
            'feedback': 5,            # Basic feedback submission
            'detailed_feedback': 10,   # Feedback with detailed comments
            'monthly_active': 15,     # Monthly activity bonus
            
            # Worker actions
            'claim_ticket': 5,        # Claiming a ticket
            'resolved_ticket': 20,    # When a ticket is resolved
            'quick_resolution': 30,   # Resolving ticket within 24 hours
            'positive_feedback': 15,  # Receiving 4-star feedback
            
            # Severity-based points (for workers)
            'high_severity': 15,      # High severity ticket
            'medium_severity': 10,    # Medium severity ticket
            'low_severity': 5,        # Low severity ticket
            
            # Special achievements
            'first_resolution': 50,   # First ticket resolution
            'five_star_rating': 25,   # Getting a 5-star rating
            'five_tickets_week': 75,  # Resolving 5 tickets in a week
            'ten_tickets_week': 150,  # Resolving 10 tickets in a week
            'zero_escalation': 100,   # No escalations in a week with 5+ tickets
            'perfect_feedback': 200   # 5 consecutive 5-star ratings
        }
        
        # Get base points for the action
        points = points_map.get(action_type, 0)
        
        # If action is related to ticket severity, get the complaint to determine severity
        if action_type in ['create_ticket', 'resolved_ticket'] and complaint_id:
            try:
                complaint = db.complaints.find_one({'_id': ObjectId(complaint_id)})
                if complaint and 'priority' in complaint:
                    severity_points = 0
                    if complaint['priority'] == 'high':
                        severity_points = points_map['high_severity']
                    elif complaint['priority'] == 'medium':
                        severity_points = points_map['medium_severity']
                    elif complaint['priority'] == 'low':
                        severity_points = points_map['low_severity']
                    
                    # Add severity points to base points
                    points += severity_points
            except Exception as e:
                print(f"Error getting complaint severity: {str(e)}")
                # Continue with base points if there's an error
        
        if points == 0:
            return {'awarded': False, 'message': 'Invalid action type'}
        
        # Get user
        user = db.users.find_one({'_id': user_id})
        if not user:
            return {'awarded': False, 'message': 'User not found'}
        
        # Create reward entry
        reward_entry = {
            'user_id': user_id,
            'points': points,
            'action_type': action_type,
            'complaint_id': ObjectId(complaint_id) if complaint_id else None,
            'timestamp': datetime.utcnow(),
            'description': f"Earned {points} points for {action_type.replace('_', ' ')}"
        }
        
        # Insert reward entry
        db.rewards.insert_one(reward_entry)
        
        # Get current level before updating points
        old_level_info = get_user_level(user_id)
        old_level = old_level_info.get('current_level', {}).get('level', 'Rookie Support Agent')
        
        # Update user's total points
        current_points = user.get('reward_points', 0)
        new_total = current_points + points
        
        db.users.update_one(
            {'_id': user_id},
            {'$set': {'reward_points': new_total}}
        )
        
        # Get new level information after updating points
        new_level_info = get_user_level(user_id)
        new_level = new_level_info.get('current_level', {}).get('level', 'Rookie Support Agent')
        
        # Check if user leveled up
        leveled_up = old_level != new_level
        
        # Send appropriate email notification
        if user.get('email'):
            if leveled_up:
                send_level_up_notification(user.get('email'), user.get('name', 'User'), old_level, new_level, new_total, new_level_info.get('current_level', {}))
            else:
                send_reward_notification(user.get('email'), points, new_total, action_type, new_level, complaint_id)
        
        return {
            'awarded': True,
            'points': points,
            'total_points': new_total,
            'action_type': action_type,
            'message': f"Earned {points} points for {action_type.replace('_', ' ')}",
            'level': new_level,
            'leveled_up': leveled_up,
            'old_level': old_level if leveled_up else None,
            'new_level': new_level if leveled_up else None
        }
        
    except Exception as e:
        print(f"Error awarding points for user {user_id}, action {action_type}: {str(e)}")
        return {'awarded': False, 'message': f"Error: {str(e)}"}
    finally:
        print(f"Awarded {points} points to user {user_id} for action {action_type}")

def get_user_rewards(user_id):
    """
    Get a user's reward history and total points
    
    Args:
        user_id (str): The user's ID
    
    Returns:
        dict: User's reward information
    """
    try:
        db = current_app.config['db']
        
        # Convert user_id to ObjectId if it's a string
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        
        # Get user
        user = db.users.find_one({'_id': user_id})
        if not user:
            return {'error': 'User not found'}
        
        # Get reward history
        rewards = list(db.rewards.find({'user_id': user_id}).sort('timestamp', -1))
        
        # Format rewards for response
        formatted_rewards = []
        for reward in rewards:
            formatted_reward = {
                'id': str(reward['_id']),
                'points': reward['points'],
                'action_type': reward['action_type'],
                'description': reward['description'],
                'timestamp': reward['timestamp'].isoformat()
            }
            
            if reward.get('complaint_id'):
                formatted_reward['complaint_id'] = str(reward['complaint_id'])
            
            formatted_rewards.append(formatted_reward)
        
        return {
            'total_points': user.get('reward_points', 0),
            'rewards': formatted_rewards
        }
        
    except Exception as e:
        print(f"Error getting user rewards: {str(e)}")
        return {'error': f"Error: {str(e)}"}

def get_reward_levels():
    """
    Get the reward levels from database
    
    Returns:
        list: Reward levels information
    """
    try:
        from flask import current_app
        db = current_app.config['db']
        
        # Get levels from database
        levels = list(db.reward_levels.find().sort('min_points', 1))
        
        # If no levels in database, return default ones
        if not levels:
            return [
                {
                    'level': 'Rookie Support Agent',
                    'min_points': 0,
                    'max_points': 99,
                    'benefits': ['Basic support access']
                },
                {
                    'level': 'Support Specialist',
                    'min_points': 100,
                    'max_points': 299,
                    'benefits': ['Priority support', 'Monthly training']
                },
                {
                    'level': 'Senior Support Specialist',
                    'min_points': 300,
                    'max_points': 599,
                    'benefits': ['Priority support', 'Monthly training', 'Exclusive webinars']
                },
                {
                    'level': 'Support Expert',
                    'min_points': 600,
                    'max_points': 999,
                    'benefits': ['VIP support', 'Monthly training', 'Exclusive webinars', 'Early feature access']
                },
                {
                    'level': 'Support Master',
                    'min_points': 1000,
                    'max_points': float('inf'),
                    'benefits': ['VIP support', 'Monthly training', 'Exclusive webinars', 'Early feature access', 'Recognition program']
                }
            ]
        
        # Format levels for return
        formatted_levels = []
        for level in levels:
            formatted_levels.append({
                'level': level['level'],
                'min_points': level['min_points'],
                'max_points': level['max_points'],
                'benefits': level['benefits'],
                'requirements': level.get('requirements', []),
                'badge_color': level.get('badge_color', '#95a5a6')
            })
        
        return formatted_levels
        
    except Exception as e:
        print(f"Error getting reward levels from database: {str(e)}")
        # Return default levels as fallback
        return [
            {
                'level': 'Rookie Support Agent',
                'min_points': 0,
                'max_points': 99,
                'benefits': ['Basic support access']
            },
            {
                'level': 'Support Specialist',
                'min_points': 100,
                'max_points': 299,
                'benefits': ['Priority support', 'Monthly training']
            },
            {
                'level': 'Senior Support Specialist',
                'min_points': 300,
                'max_points': 599,
                'benefits': ['Priority support', 'Monthly training', 'Exclusive webinars']
            },
            {
                'level': 'Support Expert',
                'min_points': 600,
                'max_points': 999,
                'benefits': ['VIP support', 'Monthly training', 'Exclusive webinars', 'Early feature access']
            },
            {
                'level': 'Support Master',
                'min_points': 1000,
                'max_points': float('inf'),
                'benefits': ['VIP support', 'Monthly training', 'Exclusive webinars', 'Early feature access', 'Recognition program']
            }
        ]

def send_level_up_notification(user_email, user_name, old_level, new_level, total_points, level_info):
    """
    Send an email notification when user levels up
    
    Args:
        user_email (str): The user's email address
        user_name (str): The user's name
        old_level (str): Previous level name
        new_level (str): New level name
        total_points (int): User's total points
        level_info (dict): Information about the new level
    
    Returns:
        bool: Whether the email was sent successfully
    """
    try:
        from utils.notifications import send_email
        
        # Get level benefits
        benefits = level_info.get('benefits', [])
        benefits_text = '\n'.join([f"• {benefit}" for benefit in benefits])
        
        # Email subject
        subject = f"🎉 Congratulations! You've reached {new_level}! 🎉"
        
        # Plain text body
        body = f"""
Congratulations {user_name}!

🎉 LEVEL UP! 🎉

You have successfully advanced from {old_level} to {new_level}!

Your Stats:
• Total Points: {total_points}
• New Level: {new_level}

Your New Benefits:
{benefits_text}

Keep up the excellent work! Your dedication and contributions are making a real difference.

Best regards,
The Complaint Management Team
        """
        
        # HTML email content
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
            <div style="background: rgba(255,255,255,0.1); padding: 40px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">🎉 LEVEL UP! 🎉</h1>
                <p style="color: #ffffff; font-size: 18px; margin: 10px 0 0 0; opacity: 0.9;">Congratulations {user_name}!</p>
            </div>
            
            <div style="background: #ffffff; padding: 40px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="background: linear-gradient(135deg, #ff6b6b, #feca57); color: white; padding: 15px 30px; border-radius: 50px; display: inline-block; font-size: 20px; font-weight: bold; margin-bottom: 20px;">
                        {old_level} → {new_level}
                    </div>
                </div>
                
                <div style="background: #f8f9fa; border-radius: 10px; padding: 25px; margin-bottom: 25px;">
                    <h2 style="color: #2c3e50; margin-top: 0; font-size: 22px;">📊 Your Achievement Stats</h2>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                        <span style="color: #7f8c8d; font-weight: 500;">Total Points:</span>
                        <span style="color: #2c3e50; font-weight: bold; font-size: 18px;">{total_points}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #7f8c8d; font-weight: 500;">New Level:</span>
                        <span style="color: #27ae60; font-weight: bold; font-size: 18px;">{new_level}</span>
                    </div>
                </div>
                
                <div style="background: #e8f5e8; border-left: 4px solid #27ae60; padding: 20px; border-radius: 5px;">
                    <h3 style="color: #27ae60; margin-top: 0; font-size: 18px;">🎁 Your New Benefits:</h3>
                    <ul style="color: #2c3e50; margin: 0; padding-left: 20px;">
                        {"".join([f"<li style='margin-bottom: 8px;'>{benefit}</li>" for benefit in benefits])}
                    </ul>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #ecf0f1;">
                    <p style="color: #7f8c8d; margin: 0; font-style: italic;">Keep up the excellent work! Your dedication is making a real difference.</p>
                </div>
            </div>
            
            <div style="background: #2c3e50; padding: 20px; text-align: center;">
                <p style="color: #bdc3c7; margin: 0; font-size: 14px;">Complaint Management System - Rewards Team</p>
            </div>
        </div>
        """
        
        # Send email
        return send_email(user_email, subject, body, html)
        
    except Exception as e:
        print(f"Error sending level-up notification: {str(e)}")
        return False

def send_reward_notification(user_email, points, total_points, action_type, current_level, complaint_id=None):
    """
    Send an email notification about earned reward points
    
    Args:
        user_email (str): The user's email address
        points (int): Points earned in this action
        total_points (int): User's total points after this action
        action_type (str): The type of action that earned points
        current_level (str): User's current reward level
        complaint_id (str, optional): The complaint ID if applicable
    
    Returns:
        bool: Whether the email was sent successfully
    """
    try:
        # Format action type for display
        action_display = action_type.replace('_', ' ').title()
        
        # Email subject
        subject = f"Achievement Unlocked: {points} Reward Points Earned! 🏆"
        
        # Get achievement description
        achievement_desc = {
            'claim_ticket': 'Taking initiative to help users',
            'resolved_ticket': 'Successfully resolving user issues',
            'quick_resolution': 'Lightning-fast problem solving',
            'positive_feedback': 'Delivering exceptional service',
            'high_severity': 'Handling critical issues',
            'first_resolution': 'Your first successful resolution',
            'five_star_rating': 'Achieving excellence in service',
            'ten_tickets_week': 'Outstanding weekly performance',
            'zero_escalation': 'Maintaining high quality standards'
        }.get(action_type, 'Contributing to the community')
        
        # HTML email content
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #4f46e5; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎉 Achievement Unlocked! 🎉</h1>
            </div>
            
            <div style="padding: 30px;">
                <div style="background-color: #f3f4f6; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 30px;">
                    <div style="font-size: 48px; color: #4f46e5; font-weight: bold; margin-bottom: 10px;">+{points}</div>
                    <div style="font-size: 20px; color: #374151;">Reward Points</div>
                    <div style="margin-top: 15px; color: #6b7280;">{achievement_desc}</div>
                </div>
                
                <div style="background-color: #ffffff; border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; margin-bottom: 30px;">
                    <h2 style="color: #111827; margin-top: 0; font-size: 20px;">Your Progress</h2>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                        <div style="color: #374151;">Total Points:</div>
                        <div style="color: #4f46e5; font-weight: bold;">{total_points}</div>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <div style="color: #374151;">Current Level:</div>
                        <div style="color: #4f46e5; font-weight: bold;">{current_level}</div>
                    </div>
                </div>
                
                <div style="text-align: center; color: #6b7280; font-size: 14px;">
                    <p>Keep up the great work! Your contributions make a difference.</p>
                    <p>Check your dashboard for more achievements to unlock.</p>
                </div>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; text-align: center;">
                <p style="color: #4b5563; margin: 0;">Complaint Management System</p>
            </div>
        </div>
        """
        
        # Send email
        return send_email(user_email, subject, body, html)
        
    except Exception as e:
        print(f"Error sending reward notification: {str(e)}")
        return False

def get_user_level(user_id):
    """
    Get a user's current reward level based on their points
    
    Args:
        user_id (str): The user's ID
    
    Returns:
        dict: User's reward level information
    """
    try:
        db = current_app.config['db']
        
        # Convert user_id to ObjectId if it's a string
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        
        # Get user
        user = db.users.find_one({'_id': user_id})
        if not user:
            return {'error': 'User not found'}
        
        total_points = user.get('reward_points', 0)
        
        # Get all reward levels
        levels = get_reward_levels()
        
        # Find the user's current level
        current_level = None
        for level in levels:
            if level['min_points'] <= total_points <= level['max_points']:
                current_level = level
                break
        
        # Find the next level if not at max
        next_level = None
        if current_level and current_level['level'] != 'Platinum':
            next_level_index = levels.index(current_level) + 1
            if next_level_index < len(levels):
                next_level = levels[next_level_index]
                points_to_next_level = next_level['min_points'] - total_points
            else:
                points_to_next_level = 0
        else:
            points_to_next_level = 0
        
        return {
            'current_level': current_level,
            'next_level': next_level,
            'total_points': total_points,
            'points_to_next_level': points_to_next_level
        }
        
    except Exception as e:
        print(f"Error getting user level: {str(e)}")
        return {'error': f"Error: {str(e)}"}