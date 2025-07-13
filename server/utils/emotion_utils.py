import cohere
import numpy as np
from datasets import load_dataset

co = cohere.Client("j4eac1MsJsxGdKNELKX4LZ04mlPJaRH93fPibCN5")
dataset = load_dataset("dair-ai/emotion")
label_names = dataset['train'].features['label'].names

emotion_examples = [
    {"text": ex["text"], "label": label_names[ex["label"]]}
    for ex in dataset["train"]
    if label_names[ex["label"]] in ["sadness", "anger", "fear"]
]

def cosine(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def detect_emotion_with_embeddings(user_input):
    try:
        texts = [user_input] + [ex["text"] for ex in emotion_examples[:300]]
        embeddings = co.embed(texts=texts).embeddings
        user_embedding = embeddings[0]
        example_embeddings = embeddings[1:]
        similarities = [cosine(user_embedding, e) for e in example_embeddings]
        best_index = int(np.argmax(similarities))
        best_score = similarities[best_index]
        best_emotion = emotion_examples[best_index]["label"]
        return best_emotion if best_score > 0.6 else "neutral"
    except Exception:
        return "neutral"
