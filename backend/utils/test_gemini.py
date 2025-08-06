import os
import sys
import json
from dotenv import load_dotenv
import google.generativeai as genai

# Add parent directory to path to import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_gemini_api():
    # Load environment variables
    load_dotenv()
    
    # Get API key
    api_key = os.getenv('GEMINI_API_KEY')
    
    if not api_key or api_key == 'your_gemini_api_key_here':
        print("\n❌ Gemini API key not set or using default value")
        print("Please set your Gemini API key in the .env file:")
        print("GEMINI_API_KEY=your_actual_api_key_here")
        print("\nYou can get an API key from: https://makersuite.google.com/app/apikey")
        return False
    
    try:
        # Configure the Gemini API
        print("Configuring Gemini API...")
        genai.configure(api_key=api_key)
        
        # Initialize the model
        print("Initializing Gemini model...")
        model = genai.GenerativeModel('gemini-pro')
        
        # Test prompt
        test_prompt = "I'm having an issue with my network connection. It keeps dropping every few minutes."
        
        print(f"\nSending test prompt to Gemini API: \"{test_prompt}\"")
        
        # System prompt
        system_prompt = """
        You are an AI assistant for a complaint management system. Analyze the user's message and determine if it's a complaint.
        Respond in JSON format with the following structure:
        {
            "intent": "complaint",
            "message": "Your response message",
            "suggestTicket": true,
            "ticketData": {
                "subject": "Brief subject",
                "description": "Full description",
                "category": "network",
                "priority": "medium"
            }
        }
        """
        
        # Generate response
        response = model.generate_content(
            [
                {"role": "system", "parts": [system_prompt]},
                {"role": "user", "parts": [test_prompt]}
            ]
        )
        
        # Print response
        print("\nResponse from Gemini API:")
        print(response.text)
        
        # Try to parse as JSON
        try:
            json_response = json.loads(response.text)
            print("\nParsed JSON response:")
            print(json.dumps(json_response, indent=2))
            
            # Check if the response has the expected structure
            if 'intent' in json_response and 'message' in json_response:
                print("\n✅ Gemini API test successful!")
                return True
            else:
                print("\n⚠️ Response doesn't have the expected structure")
                return False
        except json.JSONDecodeError:
            print("\n⚠️ Response is not valid JSON")
            print("This might be due to the model not following the JSON format instruction.")
            return False
            
    except Exception as e:
        print(f"\n❌ Error testing Gemini API: {e}")
        return False

if __name__ == "__main__":
    print("Testing Gemini API integration...")
    success = test_gemini_api()
    
    if success:
        print("\nGemini API is working correctly!")
        print("You can now use the chatbot with Gemini AI.")
    else:
        print("\nGemini API test failed. Please check your API key and try again.")