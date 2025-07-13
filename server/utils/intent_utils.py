def detect_intent(user_input: str) -> str:
    text = user_input.lower()

    if any(w in text for w in ["hi", "hello", "hey", "hii"]):
        return "greeting"

    healthcare_keywords = ["pain", "fever", "ache", "injury", "doctor", "symptom", "rash", "vomit", "headache", "bp"]
    if any(k in text for k in healthcare_keywords):
        return "healthcare"

    if any(k in text for k in ["diet", "nutrition", "meal", "plan"]):
        return "diet"

    if any(k in text for k in ["how to", "can i", "what is", "use this"]):
        return "smalltalk"

    return "unknown"

def handle_smalltalk(intent, question):
    if intent == "greeting":
        return "👋 Hello! I'm your healthcare assistant. How can I help you?"
    elif intent == "smalltalk":
        return "🙂 Sure, feel free to ask anything."
    return "I'm here to help you with health-related questions."

def ask_healthcare_bot(question, history):
    from utils.emotion_utils import co
    try:
        response = co.chat(model="command-nightly", message=question, chat_history=history)
        return response.text.strip()
    except Exception as e:
        return f"Error: {e}"
