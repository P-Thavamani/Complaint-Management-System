from datetime import datetime
from bson import ObjectId

class Complaint:
    def __init__(self, user_id, title, description, category=None, priority='normal'):
        self._id = ObjectId()
        self.user_id = user_id
        self.title = title
        self.description = description
        self.category = category
        self.priority = priority
        self.status = 'pending'
        self.assigned_to = None
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.resolved_at = None
        self.resolution_message = None
        self.needs_escalation = False
        self.escalation_reasons = []
        self.escalated_at = None
        self.is_complex = False
        self.customer_satisfaction = None

    @classmethod
    def from_dict(cls, data):
        complaint = cls(
            user_id=data['user_id'],
            title=data['title'],
            description=data['description'],
            category=data.get('category'),
            priority=data.get('priority', 'normal')
        )
        complaint._id = data.get('_id', ObjectId())
        complaint.status = data.get('status', 'pending')
        complaint.assigned_to = data.get('assigned_to')
        complaint.created_at = data.get('created_at', datetime.utcnow())
        complaint.updated_at = data.get('updated_at', datetime.utcnow())
        complaint.resolved_at = data.get('resolved_at')
        complaint.resolution_message = data.get('resolution_message')
        complaint.needs_escalation = data.get('needs_escalation', False)
        complaint.escalation_reasons = data.get('escalation_reasons', [])
        complaint.escalated_at = data.get('escalated_at')
        complaint.is_complex = data.get('is_complex', False)
        complaint.customer_satisfaction = data.get('customer_satisfaction')
        return complaint

    def to_dict(self):
        return {
            '_id': self._id,
            'user_id': self.user_id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'priority': self.priority,
            'status': self.status,
            'assigned_to': self.assigned_to,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'resolved_at': self.resolved_at,
            'resolution_message': self.resolution_message,
            'needs_escalation': self.needs_escalation,
            'escalation_reasons': self.escalation_reasons,
            'escalated_at': self.escalated_at,
            'is_complex': self.is_complex,
            'customer_satisfaction': self.customer_satisfaction
        }

    @classmethod
    def objects(cls, **kwargs):
        from flask import current_app
        db = current_app.config['db']
        
        # Convert string IDs to ObjectId
        if 'id' in kwargs:
            kwargs['_id'] = ObjectId(kwargs.pop('id'))
        if 'user_id' in kwargs and isinstance(kwargs['user_id'], str):
            kwargs['user_id'] = ObjectId(kwargs['user_id'])
        if 'assigned_to' in kwargs and isinstance(kwargs['assigned_to'], str):
            kwargs['assigned_to'] = ObjectId(kwargs['assigned_to'])
        
        class QuerySet:
            def __init__(self, collection, query):
                self.collection = collection
                self.query = query
            
            def first(self):
                result = self.collection.find_one(self.query)
                return cls.from_dict(result) if result else None
            
            def all(self):
                return [cls.from_dict(doc) for doc in self.collection.find(self.query)]
            
            def count(self):
                return self.collection.count_documents(self.query)
            
            def update(self, update_data):
                result = self.collection.update_many(self.query, {'$set': update_data})
                return result.modified_count
            
            def delete(self):
                result = self.collection.delete_many(self.query)
                return result.deleted_count
        
        return QuerySet(db.complaints, kwargs)