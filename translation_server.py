from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import sys

app = Flask(__name__)
CORS(app)

print("\n⏳ Loading local NLLB-200 translation model... This will take a moment.")
model_name = "facebook/nllb-200-distilled-600M"

try:
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
    print("✅ Dedicated Translation Server loaded and ready on port 5001!\n")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    sys.exit(1)

lang_map = {
    "hi": "hin_Deva",
    "mr": "mar_Deva",
    "en": "eng_Latn"
}

@app.route('/translate', methods=['POST'])
def translate_api():
    data = request.json
    text = data.get('text', '')
    target_lang = data.get('target_lang', 'en')

    if not text or target_lang == "en":
        return jsonify({"translatedText": text})

    try:
        inputs = tokenizer(text, return_tensors="pt")
        # Ensure we don't crash if an unknown language is passed
        mapped_lang = lang_map.get(target_lang, lang_map["hi"])
        
        translated_tokens = model.generate(
            **inputs,
            forced_bos_token_id=tokenizer.convert_tokens_to_ids(mapped_lang)
        )
        result = tokenizer.decode(translated_tokens[0], skip_special_tokens=True)
        return jsonify({"translatedText": result})
    except Exception as e:
        print("Translation error:", e)
        return jsonify({"translatedText": text})

if __name__ == '__main__':
    # Running on 5001 so it avoids collision with Node (5000) and Vite (5173)
    app.run(port=5001, debug=False)
