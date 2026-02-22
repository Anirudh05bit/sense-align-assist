import ollama
import json
import re

MODEL_NAME = "llama3"


def extract_json(text: str):
    """
    Safely extract JSON from LLM output
    """
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return None

    try:
        return json.loads(match.group())
    except:
        return None


def classify_report_text(text: str):
    prompt = f"""
You are a medical disability classifier.

Analyze the report and return ONLY valid JSON.

Format EXACTLY like this:

{{
  "primary_disability": "visual | hearing | cognitive | multiple | none",
  "confidence": number_between_0_and_100,
  "summary": "short explanation",
  "assistant_to_load": "visual_assistant | speech_assistant | learning_assistant | none"
}}

Report:
{text}
"""

    try:
        response = ollama.chat(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
        )

        raw = response["message"]["content"]
        print("===== LLM RAW OUTPUT =====")
        print(raw)

        parsed = extract_json(raw)

        if not parsed:
            raise Exception("LLM returned invalid JSON")

        # Ensure safe defaults
        parsed["confidence"] = max(0, min(100, int(parsed.get("confidence", 0))))

        return parsed

    except Exception as e:
        print("Classifier error:", e)

        return {
            "primary_disability": "none",
            "confidence": 0,
            "summary": "Could not classify report",
            "assistant_to_load": "none",
        }