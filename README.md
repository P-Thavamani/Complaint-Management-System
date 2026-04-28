<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->
<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![Custom License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/P-Thavamani/Complaint-Management-System">
    <img src="https://img.icons8.com/?size=100&id=114322&format=png&color=000000" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">GrievAI</h3>

  <p align="center">
    Intelligent Grievance Management System with Multi-Modal AI Capabilities
    <br />
    <a href="https://github.com/P-Thavamani/Complaint-Management-System"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/P-Thavamani/Complaint-Management-System">View Demo</a>
    ·
    <a href="https://github.com/P-Thavamani/Complaint-Management-System/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    ·
    <a href="https://github.com/P-Thavamani/Complaint-Management-System/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
        <li><a href="#core-features">Core Features</a></li>
        <li><a href="#ai--multi-modal-capabilities">AI & Multi-Modal Capabilities</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
## About The Project


GrievAI is a comprehensive, modern grievance management solution that leverages cutting-edge Artificial Intelligence to streamline complaint submission, smart ticketing, categorization, and automated resolution workflows. Built on a decoupled architecture, it separates the client interface from the backend API services to ensure scalability and maintainability.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

This project relies on robust, modern technologies to deliver a fast and reliable experience.

* [![React][React.js]][React-url]
* [![Flask][Flask.org]][Flask-url]
* [![MongoDB][MongoDB.com]][MongoDB-url]
* [![TailwindCSS][TailwindCSS.com]][TailwindCSS-url]
* [![Gemini API][Gemini.com]][Gemini-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Core Features
* **Role-Based Access Control**: Secure JWT authentication for Users, Workers, and Administrators.
* **Smart Ticketing System**: Automated ticket generation with auto-priority assignment.
* **Interactive Dashboard**: Real-time tracking and statistical overview using Chart.js.
* **Escalation Workflow**: Built-in mechanisms to escalate unresolved or high-priority complaints.

### AI & Multi-Modal Capabilities
* **AI-Powered Chatbot**: A 24/7 intelligent assistant powered by Google's Gemini API to guide users through the complaint process.
* **Multi-Modal Logging**: Submit grievances naturally via Text, Voice (Speech-to-Text), or Image.
* **Intelligent Categorization**: Uses AI to understand the context of the complaint and auto-assign it to the correct department.
* **Computer Vision (YOLOv8)**: Detects objects and validates issues directly from user-uploaded images (Optional/Extensible module).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Ensure you have the following installed on your system:
* Node.js (v14.0+) and npm
  ```sh
  npm install npm@latest -g
  ```
* Python (v3.8+)
* MongoDB (Local instance or MongoDB Atlas cloud account)
* Google Gemini API Key

### Installation

1. Get a free Gemini API Key at [Google AI Studio](https://aistudio.google.com/)
2. Clone the repo
   ```sh
   git clone https://github.com/P-Thavamani/Complaint-Management-System.git
   ```
3. Set up the backend
   ```sh
   cd backend
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   # source venv/bin/activate
   pip install -r requirements.txt
   ```
4. Configure backend environment variables. Create a `.env` file in the `backend` directory:
   ```env
   MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/grievai?retryWrites=true&w=majority
   SECRET_KEY=your_super_secret_jwt_key
   FLASK_ENV=development
   GEMINI_API_KEY=ENTER_YOUR_API_KEY
   ```
5. Start the backend server
   ```sh
   python run.py
   ```
6. Open a new terminal, set up the frontend
   ```sh
   cd frontend
   npm install
   ```
7. Start the frontend development server
   ```sh
   npm start
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->
## Usage

### 👤 User Workflow
1. **Onboarding**: Register and log in securely.
2. **Dashboard**: View a personalized dashboard showing the status of past complaints.
3. **Submission**: Log a new grievance using the interactive form or simply chat with the AI bot. Upload images or use voice notes for clarity.
4. **Tracking**: Receive a unique tracking ID and watch the status move from `Pending` → `In Progress` → `Resolved`.

### 🛡️ Admin & Worker Workflow
1. **Overview**: Admins access a high-level analytics dashboard displaying complaint volumes, category distributions, and resolution times.
2. **Triage**: AI automatically tags incoming complaints. Admins can verify and route them to specific workers.
3. **Resolution**: Workers update the status of the complaints, add internal notes, and communicate the resolution back to the user.
4. **Escalation**: View and prioritize complaints that have breached their SLA.

_For more examples, please refer to the [Documentation](https://github.com/P-Thavamani/Complaint-Management-System/wiki)_

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ROADMAP -->
## Roadmap

- [x] Initial full-stack implementation
- [x] JWT Authentication and RBAC
- [x] Google Gemini AI Chatbot integration
- [ ] Add Multi-language Support
    - [ ] Spanish
    - [ ] Hindi
- [ ] Implement Push Notifications (WebSockets/Firebase)
- [ ] Expand YOLOv8 integration for automated evidence verification

See the [open issues](https://github.com/P-Thavamani/Complaint-Management-System/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->
## License

Distributed under a Custom Attribution License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->
## Contact

P Thavamani - [LinkedIn](https://linkedin.com/in/PThavamani) - bot.thavamani@gmail.com

Project Link: [https://github.com/P-Thavamani/Complaint-Management-System](https://github.com/P-Thavamani/Complaint-Management-System)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [React.js](https://reactjs.org/)
* [Flask](https://flask.palletsprojects.com/)
* [Google Gemini API](https://aistudio.google.com/)
* [TailwindCSS](https://tailwindcss.com/)
* [Chart.js](https://www.chartjs.org/)
* [Img Shields](https://shields.io)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/P-Thavamani/Complaint-Management-System.svg?style=for-the-badge&color=2ea44f&logo=github
[contributors-url]: https://github.com/P-Thavamani/Complaint-Management-System/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/P-Thavamani/Complaint-Management-System.svg?style=for-the-badge&color=blue&logo=github
[forks-url]: https://github.com/P-Thavamani/Complaint-Management-System/network/members
[stars-shield]: https://img.shields.io/github/stars/P-Thavamani/Complaint-Management-System.svg?style=for-the-badge&color=yellow&logo=github
[stars-url]: https://github.com/P-Thavamani/Complaint-Management-System/stargazers
[issues-shield]: https://img.shields.io/github/issues/P-Thavamani/Complaint-Management-System.svg?style=for-the-badge&color=red&logo=github
[issues-url]: https://github.com/P-Thavamani/Complaint-Management-System/issues
[license-shield]: https://img.shields.io/badge/License-Custom_Attribution-blueviolet?style=for-the-badge&logo=open-source-initiative
[license-url]: https://github.com/P-Thavamani/Complaint-Management-System/blob/main/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-0077B5?style=for-the-badge&logo=linkedin&color=0077B5
[linkedin-url]: https://linkedin.com/in/pthavamani
[product-screenshot]: ./assets/hero_banner.png
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Flask.org]: https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white
[Flask-url]: https://flask.palletsprojects.com/
[MongoDB.com]: https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white
[MongoDB-url]: https://www.mongodb.com/
[TailwindCSS.com]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[TailwindCSS-url]: https://tailwindcss.com/
[Gemini.com]: https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white
[Gemini-url]: https://aistudio.google.com/
