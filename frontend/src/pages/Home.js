import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">AI-Powered Complaint Management System</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Efficiently handle complaints with our intelligent system that uses AI to understand, categorize, and resolve issues.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="btn-secondary text-lg px-8 py-3">
              Get Started
            </Link>
            <Link to="/login" className="bg-white text-primary-700 hover:bg-gray-100 font-medium py-3 px-8 rounded-md transition-colors duration-200 text-lg">
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Link to="/dashboard" className="card text-center hover:shadow-lg transition-shadow duration-300">
              <div className="rounded-full bg-primary-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Chatbot</h3>
              <p className="text-gray-600">
                Our intelligent chatbot understands natural language, responds to FAQs, and handles voice commands and image uploads.
              </p>
            </Link>
            
            {/* Feature 2 */}
            <Link to="/dashboard" className="card text-center hover:shadow-lg transition-shadow duration-300">
              <div className="rounded-full bg-primary-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Ticketing System</h3>
              <p className="text-gray-600">
                Automatically logs, categorizes, prioritizes, and assigns tickets to the appropriate team based on AI analysis.
              </p>
            </Link>
            
            {/* Feature 3 */}
            <Link to="/dashboard" className="card text-center hover:shadow-lg transition-shadow duration-300">
              <div className="rounded-full bg-primary-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Tracking</h3>
              <p className="text-gray-600">
                Track your complaint progress in real-time with status updates and notifications at each stage of resolution.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Multi-Input Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Multiple Ways to Submit Complaints</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Text Input */}
            <Link to="/dashboard" className="card hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <div className="rounded-full bg-blue-100 p-3 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Text Complaints</h3>
              </div>
              <p className="text-gray-600">
                Type your complaint directly into our chatbot interface. Our NLP system will understand your issue and provide immediate assistance.
              </p>
            </Link>
            
            {/* Voice Input */}
            <Link to="/dashboard" className="card hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <div className="rounded-full bg-green-100 p-3 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Voice Complaints</h3>
              </div>
              <p className="text-gray-600">
                Simply speak your complaint using our voice input feature. Google Speech-to-Text converts your voice to text for processing.
              </p>
            </Link>
            
            {/* Image Input */}
            <Link to="/dashboard" className="card hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <div className="rounded-full bg-purple-100 p-3 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Image Uploads</h3>
              </div>
              <p className="text-gray-600">
                Upload images of the issue you're facing. Our YOLOv8 model will analyze the images to detect and categorize the problem.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-0 md:left-1/2 transform md:translate-x-[-50%] h-full w-1 bg-primary-200"></div>
              
              {/* Step 1 */}
              <div className="relative mb-12">
                <div className="flex flex-col md:flex-row items-center">
                  <div className="flex-1 md:text-right md:pr-8 mb-4 md:mb-0">
                    <h3 className="text-xl font-semibold mb-2">Submit Your Complaint</h3>
                    <p className="text-gray-600">Use text, voice, or image to submit your complaint through our user-friendly interface.</p>
                  </div>
                  <div className="z-10 flex items-center justify-center w-12 h-12 rounded-full bg-primary-500 text-white font-bold">
                    1
                  </div>
                  <div className="flex-1 md:pl-8 hidden md:block"></div>
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="relative mb-12">
                <div className="flex flex-col md:flex-row items-center">
                  <div className="flex-1 md:text-right md:pr-8 hidden md:block"></div>
                  <div className="z-10 flex items-center justify-center w-12 h-12 rounded-full bg-primary-500 text-white font-bold">
                    2
                  </div>
                  <div className="flex-1 md:pl-8 mb-4 md:mb-0">
                    <h3 className="text-xl font-semibold mb-2">AI Processing</h3>
                    <p className="text-gray-600">Our AI analyzes your complaint, categorizes it, and attempts to provide an immediate solution.</p>
                  </div>
                </div>
              </div>
              
              {/* Step 3 */}
              <div className="relative mb-12">
                <div className="flex flex-col md:flex-row items-center">
                  <div className="flex-1 md:text-right md:pr-8 mb-4 md:mb-0">
                    <h3 className="text-xl font-semibold mb-2">Ticket Generation</h3>
                    <p className="text-gray-600">If the issue can't be resolved immediately, a ticket is automatically generated and assigned to the appropriate team.</p>
                  </div>
                  <div className="z-10 flex items-center justify-center w-12 h-12 rounded-full bg-primary-500 text-white font-bold">
                    3
                  </div>
                  <div className="flex-1 md:pl-8 hidden md:block"></div>
                </div>
              </div>
              
              {/* Step 4 */}
              <div className="relative">
                <div className="flex flex-col md:flex-row items-center">
                  <div className="flex-1 md:text-right md:pr-8 hidden md:block"></div>
                  <div className="z-10 flex items-center justify-center w-12 h-12 rounded-full bg-primary-500 text-white font-bold">
                    4
                  </div>
                  <div className="flex-1 md:pl-8 mb-4 md:mb-0">
                    <h3 className="text-xl font-semibold mb-2">Resolution & Feedback</h3>
                    <p className="text-gray-600">Track your complaint status in real-time and receive notifications as it progresses toward resolution.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied users who have streamlined their complaint management process with our AI-powered system.
          </p>
          <Link to="/register" className="bg-white text-primary-700 hover:bg-gray-100 font-medium py-3 px-8 rounded-md transition-colors duration-200 text-lg inline-block">
            Create Your Account
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;