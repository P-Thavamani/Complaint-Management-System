from datetime import datetime
from bson import ObjectId

class Feedback:
    def __init__(self, complaint_id, user_id, rating=5, comment='', resolved=True):
        self._id = ObjectId()
        self.complaint_id = complaint_id
        self.user_id = user_id
        self.rating = rating
        self.comment = comment
        self.resolved = resolved
        self.created_at = datetime.utcnow()

    @classmethod
    def from_dict(cls, data):
        feedback = cls(
            complaint_id=data['complaint_id'],
            user_id=data['user_id'],
            rating=data.get('rating', 5),
            comment=data.get('comment', ''),
            resolved=data.get('resolved', True)
        )
        feedback._id = data.get('_id', ObjectId())
        feedback.created_at = data.get('created_at', datetime.utcnow())
        return feedback

    def to_dict(self):
        return {
            '_id': self._id,
            'complaint_id': self.complaint_id,
            'user_id': self.user_id,
            'rating': self.rating,
            'comment': self.comment,
            'resolved': self.resolved,
            'created_at': self.created_at
        }

    @classmethod
    def objects(cls, **kwargs):
        from flask import current_app
        db = current_app.config['db']
        
        # Convert string IDs to ObjectId
        if 'id' in kwargs:
            kwargs['_id'] = ObjectId(kwargs.pop('id'))
        if 'complaint_id' in kwargs and isinstance(kwargs['complaint_id'], str):
            kwargs['complaint_id'] = ObjectId(kwargs['complaint_id'])
        if 'user_id' in kwargs and isinstance(kwargs['user_id'], str):
            kwargs['user_id'] = ObjectId(kwargs['user_id'])
        
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
            
            def save(self):
                if '_id' not in self.query:
                    self.query['_id'] = ObjectId()
                self.collection.insert_one(self.query)
                return cls.from_dict(self.query)
        
        return QuerySet(db.feedback, kwargs)