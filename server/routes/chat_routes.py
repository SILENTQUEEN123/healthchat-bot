from fastapi import APIRouter, Depends
from bson import ObjectId
from db import chats_collection
from models.chat_models import *
from utils.emotion_utils import detect_emotion_with_embeddings
from utils.intent_utils import detect_intent, handle_smalltalk, ask_healthcare_bot
from routes.auth_routes import get_current_user

router = APIRouter()

@router.post("/chat", response_model=ChatOutput)
async def chat_endpoint(chat: ChatInput):
    chat_doc = await chats_collection.find_one({"_id": ObjectId(chat.session_id)})
    history = chat_doc["messages"] if chat_doc else []
    formatted_history = [{"role": m["role"], "message": m["message"]} for m in history]

    emotion = detect_emotion_with_embeddings(chat.message)
    intent = detect_intent(chat.message)

    if intent in ["greeting", "smalltalk"]:
        reply = handle_smalltalk(intent, chat.message)
    elif intent in ["healthcare", "unknown"]:
        reply = ask_healthcare_bot(chat.message, formatted_history)
    else:
        reply = "🫶 Please tell me more about your health concerns."

    new_msgs = [
        {"role": "USER", "message": chat.message.strip()},
        {"role": "CHATBOT", "message": reply}
    ]
    await chats_collection.update_one(
        {"_id": ObjectId(chat.session_id)},
        {"$push": {"messages": {"$each": new_msgs}}}
    )

    return ChatOutput(reply=reply, emotion=emotion)

@router.post("/chat/create")
async def create_chat(data: CreateChatModel, current_user: dict = Depends(get_current_user)):
    result = await chats_collection.insert_one({
        "name": data.name,
        "messages": [],
        "user_id": current_user["id"]
    })
    return {"chat_id": str(result.inserted_id), "name": data.name}

@router.get("/chat/sessions")
async def list_chats(current_user: dict = Depends(get_current_user)):
    chats = await chats_collection.find({"user_id": current_user["id"]}).to_list(None)
    return [{"chat_id": str(c["_id"]), "name": c["name"]} for c in chats]

@router.get("/chat/{chat_id}")
async def get_chat(chat_id: str, current_user: dict = Depends(get_current_user)):
    chat = await chats_collection.find_one({"_id": ObjectId(chat_id), "user_id": current_user["id"]})
    if not chat:
        return {"error": "Chat not found"}
    return {
        "chat_id": str(chat["_id"]),
        "name": chat["name"],
        "messages": chat["messages"]
    }

@router.put("/chat/rename")
async def rename_chat(data: RenameChatModel):
    await chats_collection.update_one({"_id": ObjectId(data.chat_id)}, {"$set": {"name": data.new_name}})
    return {"message": "Chat renamed"}

@router.put("/chat/edit-message")
async def edit_message(data: UpdateMessageModel):
    await chats_collection.update_one(
        {"_id": ObjectId(data.chat_id)},
        {"$set": {f"messages.{data.index}.message": data.new_message}}
    )
    return {"message": "Message updated"}

@router.delete("/chat/{chat_id}")
async def delete_chat(chat_id: str):
    result = await chats_collection.delete_one({"_id": ObjectId(chat_id)})
    return {"deleted": result.deleted_count > 0}
