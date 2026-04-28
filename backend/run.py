import os
from app import app

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    is_dev = os.getenv('FLASK_ENV') == 'development'
    app.run(
        host='0.0.0.0', 
        port=port, 
        debug=is_dev,
        reloader_type='stat' if is_dev else None,
        threaded=True
    )