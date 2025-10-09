from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from utils.auth_middleware import worker_required

worker_bp = Blueprint('worker', __name__)

@worker_bp.route('/dashboard', methods=['GET'])
@worker_required
def worker_dashboard(current_user):
    """
    Get worker dashboard data including assigned complaints
    """
    try:
        db = current_app.config['db']
        worker_id = ObjectId(current_user['id'])
        
        # Get assigned complaints
        assigned_complaints = list(db.complaints.find({
            'assigned_to': worker_id
        }).sort('createdAt', -1))
        
        # Format complaints for response
        formatted_complaints = []
        for complaint in assigned_complaints:
            formatted_complaint = {
                'id': str(complaint['_id']),
                'subject': complaint.get('subject', 'No subject'),
                'description': complaint.get('description', ''),
                'category': complaint.get('category', 'General'),
                'status': complaint.get('status', 'pending'),
                'priority': complaint.get('priority', 'medium'),
                'createdAt': complaint.get('createdAt').isoformat() if 'createdAt' in complaint else None,
                'updatedAt': complaint.get('updatedAt').isoformat() if 'updatedAt' in complaint else None
            }
            
            # Add user info if available
            if 'user_id' in complaint:
                user = db.users.find_one({'_id': complaint['user_id']})
                if user:
                    formatted_complaint['user'] = {
                        'id': str(user['_id']),
                        'name': user.get('name', 'Unknown'),
                        'email': user.get('email', '')
                    }
            
            formatted_complaints.append(formatted_complaint)
        
        # Get worker stats
        total_assigned = len(formatted_complaints)
        pending = sum(1 for c in assigned_complaints if c.get('status') == 'pending')
        in_progress = sum(1 for c in assigned_complaints if c.get('status') == 'in-progress')
        resolved = sum(1 for c in assigned_complaints if c.get('status') == 'resolved')
        
        # Get recent activity
        one_week_ago = datetime.utcnow() - timedelta(days=7)
        recent_activity = list(db.complaints.find({
            'assigned_to': worker_id,
            'updatedAt': {'$gte': one_week_ago}
        }).sort('updatedAt', -1).limit(5))
        
        formatted_activity = []
        for activity in recent_activity:
            formatted_activity.append({
                'id': str(activity['_id']),
                'subject': activity.get('subject', 'No subject'),
                'status': activity.get('status', 'pending'),
                'updatedAt': activity.get('updatedAt').isoformat() if 'updatedAt' in activity else None
            })
        
        return jsonify({
            'complaints': formatted_complaints,
            'stats': {
                'total': total_assigned,
                'pending': pending,
                'inProgress': in_progress,
                'resolved': resolved
            },
            'recentActivity': formatted_activity
        })
    except Exception as e:
        print(f"Error getting worker dashboard: {str(e)}")
        return jsonify({'error': str(e)}), 500

@worker_bp.route('/complaints/<complaint_id>/update', methods=['PUT'])
@worker_required
def update_complaint(current_user, complaint_id):
    """
    Update a complaint assigned to the worker
    """
    try:
        data = request.get_json()
        db = current_app.config['db']
        worker_id = ObjectId(current_user['id'])
        
        # Validate complaint ID
        try:
            complaint_obj_id = ObjectId(complaint_id)
        except:
            return jsonify({'error': 'Invalid complaint ID'}), 400
        
        # Get complaint
        complaint = db.complaints.find_one({
            '_id': complaint_obj_id,
            'assigned_to': worker_id
        })
        
        if not complaint:
            return jsonify({'error': 'Complaint not found or not assigned to you'}), 404
        
        # Fields that workers can update
        allowed_fields = ['status', 'resolution', 'notes']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        # Add timestamps based on status changes
        current_status = complaint.get('status')
        new_status = data.get('status')
        
        if new_status and new_status != current_status:
            if new_status == 'in-progress':
                update_data['inProgressAt'] = datetime.utcnow()
            elif new_status == 'resolved':
                update_data['resolvedAt'] = datetime.utcnow()
        
        # Add updated timestamp
        update_data['updatedAt'] = datetime.utcnow()
        
        # Update complaint
        db.complaints.update_one(
            {'_id': complaint_obj_id},
            {'$set': update_data}
        )
        
        # Add comment if provided
        if 'comment' in data and data['comment']:
            comment = {
                '_id': ObjectId(),
                'content': data['comment'],
                'user_id': worker_id,
                'user': {
                    'name': current_user.get('name', 'Worker'),
                    'email': current_user.get('email', '')
                },
                'createdAt': datetime.utcnow(),
                'isSystem': False
            }
            
            db.complaints.update_one(
                {'_id': complaint_obj_id},
                {'$push': {'comments': comment}}
            )
        
        # Get updated complaint
        updated_complaint = db.complaints.find_one({'_id': complaint_obj_id})
        
        # Format for response
        formatted_complaint = {
            'id': str(updated_complaint['_id']),
            'subject': updated_complaint.get('subject', 'No subject'),
            'description': updated_complaint.get('description', ''),
            'category': updated_complaint.get('category', 'General'),
            'status': updated_complaint.get('status', 'pending'),
            'priority': updated_complaint.get('priority', 'medium'),
            'resolution': updated_complaint.get('resolution', ''),
            'createdAt': updated_complaint.get('createdAt').isoformat() if 'createdAt' in updated_complaint else None,
            'updatedAt': updated_complaint.get('updatedAt').isoformat() if 'updatedAt' in updated_complaint else None
        }
        
        return jsonify({
            'message': 'Complaint updated successfully',
            'complaint': formatted_complaint
        })
    except Exception as e:
        print(f"Error updating complaint: {str(e)}")
        return jsonify({'error': str(e)}), 500