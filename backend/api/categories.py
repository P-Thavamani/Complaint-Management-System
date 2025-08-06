from flask import Blueprint, jsonify

categories_bp = Blueprint('categories', __name__)

# Define the categories and subcategories structure
complaint_categories = {
    'billing': {
        'name': 'Billing Issue',
        'subcategories': {
            'overcharged': {
                'name': 'Overcharged',
                'problem': 'User is charged more than expected.',
                'solution': [
                    'Check your latest invoice from the billing section.',
                    'Compare it with the subscribed plan.',
                    'If mismatch found, try reloading the plan or contact support.'
                ]
            },
            'duplicate_charges': {
                'name': 'Duplicate Charges',
                'problem': 'Same amount deducted multiple times.',
                'solution': [
                    'Verify with your bank transaction history.',
                    'If duplicate, contact support with the transaction IDs.'
                ]
            },
            'wrong_plan': {
                'name': 'Wrong Plan Charged',
                'problem': 'Billed for the wrong plan.',
                'solution': [
                    'Go to Subscription settings.',
                    'Validate the plan selected.',
                    'Raise a support request if incorrect.'
                ]
            }
        }
    },
    'technical': {
        'name': 'Technical Problem',
        'subcategories': {
            'app_crash': {
                'name': 'App Crash / Freeze',
                'problem': 'App crashes or freezes on startup.',
                'solution': [
                    'Restart the app.',
                    'Clear app cache and try again.',
                    'Reinstall if issue persists.'
                ]
            },
            'feature_not_working': {
                'name': 'Feature Not Working',
                'problem': 'Certain functionality is not responding.',
                'solution': [
                    'Log out and log back in.',
                    'Ensure the latest update is installed.',
                    'Restart device.'
                ]
            },
            'slow_performance': {
                'name': 'Slow Performance',
                'problem': 'App is very slow to respond.',
                'solution': [
                    'Clear cache and background apps.',
                    'Ensure internet connection is stable.'
                ]
            }
        }
    },
    'service': {
        'name': 'Service Complaint',
        'subcategories': {
            'unavailable_service': {
                'name': 'Unavailable Service',
                'problem': 'Service not available in region.',
                'solution': [
                    'Check service availability page.',
                    'Contact support for region rollout info.'
                ]
            },
            'poor_quality': {
                'name': 'Poor Service Quality',
                'problem': 'Service is not up to mark.',
                'solution': [
                    'Share feedback via in-app feedback form.',
                    'Wait for service team response.'
                ]
            },
            'delay': {
                'name': 'Delay in Service',
                'problem': 'Delayed support or processing.',
                'solution': [
                    'Check SLA mentioned in your plan.',
                    'If overdue, contact customer care.'
                ]
            }
        }
    },
    'feedback': {
        'name': 'General Feedback',
        'subcategories': {
            'suggestion': {
                'name': 'Suggestion',
                'problem': 'User wants to share ideas.',
                'solution': [
                    'Fill out suggestion form.',
                    'Await response from innovation team.'
                ]
            },
            'complaint': {
                'name': 'Complaint',
                'problem': 'General dissatisfaction.',
                'solution': [
                    'Submit feedback through chatbot.',
                    'Escalation possible through "Open Ticket".'
                ]
            },
            'appreciation': {
                'name': 'Appreciation',
                'problem': 'Positive feedback.',
                'solution': [
                    'Thank you! Your message is shared with the team.'
                ]
            }
        }
    },
    'account': {
        'name': 'Account Inquiry',
        'subcategories': {
            'login_issue': {
                'name': 'Login Issue',
                'problem': 'Cannot log in.',
                'solution': [
                    'Use "Forgot Password".',
                    'Try social login if applicable.'
                ]
            },
            'profile_update': {
                'name': 'Profile Update',
                'problem': 'Unable to update details.',
                'solution': [
                    'Go to profile settings > Edit.',
                    'Ensure all required fields are filled.'
                ]
            },
            'account_deactivation': {
                'name': 'Account Deactivation',
                'problem': 'Want to close account.',
                'solution': [
                    'Visit Account Settings > Deactivate Account.'
                ]
            }
        }
    },
    'other': {
        'name': 'Other Issue',
        'subcategories': {
            'not_listed': {
                'name': 'Not Listed Above',
                'problem': 'Unique issue not covered.',
                'solution': [
                    'Click "Open Ticket".',
                    'Fill in issue description.',
                    'Wait for ticket assignment.'
                ]
            }
        }
    }
}

@categories_bp.route('/', methods=['GET'])
def get_all_categories():
    """
    Get all complaint categories and their subcategories
    """
    return jsonify(complaint_categories)

@categories_bp.route('/<category_id>', methods=['GET'])
def get_category(category_id):
    """
    Get a specific category and its subcategories
    """
    if category_id not in complaint_categories:
        return jsonify({'error': 'Category not found'}), 404
    
    return jsonify(complaint_categories[category_id])

@categories_bp.route('/<category_id>/subcategories', methods=['GET'])
def get_subcategories(category_id):
    """
    Get all subcategories for a specific category
    """
    if category_id not in complaint_categories:
        return jsonify({'error': 'Category not found'}), 404
    
    return jsonify(complaint_categories[category_id]['subcategories'])

@categories_bp.route('/<category_id>/subcategories/<subcategory_id>', methods=['GET'])
def get_subcategory(category_id, subcategory_id):
    """
    Get a specific subcategory
    """
    if category_id not in complaint_categories:
        return jsonify({'error': 'Category not found'}), 404
    
    if subcategory_id not in complaint_categories[category_id]['subcategories']:
        return jsonify({'error': 'Subcategory not found'}), 404
    
    return jsonify(complaint_categories[category_id]['subcategories'][subcategory_id])