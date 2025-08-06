# Complaint Management System with Chatbot Integration & Ticket Support Generation

A comprehensive complaint management solution with AI-powered chatbot integration, smart ticketing, and multi-modal complaint submission capabilities.

## Features

### Core Features

- **User Authentication**: Secure login/registration system with JWT authentication
- **AI-Powered Chatbot**: Intelligent chatbot for complaint submission and assistance
- **Smart Ticketing System**: Automated ticket generation with priority assignment
- **Multi-Modal Complaint Logging**: Submit complaints via text, voice, or image
- **Real-Time Tracking**: Monitor complaint status and updates in real-time
- **Admin Dashboard**: Comprehensive analytics and complaint management
- **Escalation Workflow**: Structured process for escalating unresolved complaints

### Unique Enhancements

- **Voice-to-Text Conversion**: Using Google Speech-to-Text for voice complaint processing
- **Image Analysis with YOLOv8**: Detect objects and issues in uploaded images
- **Intelligent Categorization**: Auto-categorize complaints based on content analysis
- **Priority Assignment**: Smart prioritization based on complaint severity
- **Interactive Timeline**: Visual representation of complaint progress

## Tech Stack

### Frontend
- React.js with Hooks and Context API
- TailwindCSS for responsive UI
- Chart.js for data visualization
- React Router for navigation

### Backend
- Flask RESTful API
- MongoDB for database
- JWT for authentication
- Google Speech-to-Text API
- YOLOv8 for image analysis
- Google Gemini API for enhanced chatbot capabilities

## Project Structure

```
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── chatbot/
│   │   │   ├── complaints/
│   │   │   └── layout/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── tailwind.config.js
└── backend/
    ├── api/
    │   ├── auth.py
    │   ├── complaints.py
    │   ├── chatbot.py
    │   ├── admin.py
    │   └── users.py
    ├── models/
    ├── services/
    ├── utils/
    ├── app.py
    └── requirements.txt
```

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- Python (v3.8+)
- MongoDB

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start Flask server
python app.py
```

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
MONGO_URI=mongodb://localhost:27017/complaint_system
SECRET_KEY=your_secret_key_here
FLASK_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
```

To get a Gemini API key, visit [Google AI Studio](https://makersuite.google.com/app/apikey) and create a new API key.

## Usage

### User Workflow

1. Register/Login to the system
2. Navigate to the dashboard to view existing complaints
3. Submit a new complaint via:
   - Text input
   - Voice recording
   - Image upload
4. Track complaint status and updates
5. Receive notifications on status changes

### Admin Workflow

1. Login with admin credentials
2. View all complaints in the admin dashboard
3. Analyze complaint statistics and trends
4. Assign, update, or resolve complaints
5. Manage escalation workflow

## License

MIT