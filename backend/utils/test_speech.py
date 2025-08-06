import speech_recognition as sr
from pydub import AudioSegment
import os

def test_speech_recognition():
    try:
        # Initialize recognizer
        recognizer = sr.Recognizer()
        print("Speech recognition initialized successfully!")
        
        # Test if we can access the microphone (optional)
        try:
            with sr.Microphone() as source:
                print("Microphone access successful!")
        except Exception as e:
            print(f"Note: Microphone access failed, but this is not critical for server operation: {e}")
        
        # Test if pydub is working
        try:
            # Create a simple silent audio segment
            silent_audio = AudioSegment.silent(duration=1000)  # 1 second of silence
            print("Pydub audio processing successful!")
        except Exception as e:
            print(f"Error with pydub: {e}")
            return False
        
        print("All speech recognition components are working!")
        return True
    except Exception as e:
        print(f"Error testing speech recognition: {e}")
        return False

if __name__ == "__main__":
    print("Testing speech recognition components...")
    success = test_speech_recognition()
    
    if success:
        print("Speech recognition is set up correctly!")
    else:
        print("Speech recognition test failed. Please check your installation.")