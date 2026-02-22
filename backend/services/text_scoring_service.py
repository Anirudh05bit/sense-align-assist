from difflib import SequenceMatcher

class TextScoringService:
    def calculate_reading_accuracy(self, original_text: str, typed_text: str) -> float:
        if not original_text:
            return 0.0
        
        # Simple similarity ratio
        similarity = SequenceMatcher(None, original_text.lower(), typed_text.lower()).ratio()
        return round(similarity * 100, 2)

    def calculate_final_score(self, accuracy: float, stability: float, movement_speed: float) -> dict:
        # Vision Score = 50% Reading Accuracy + 30% Behavioral Stability + 20% Movement / Speed Score
        vision_score = (0.5 * accuracy) + (0.3 * stability) + (0.2 * movement_speed)
        vision_score = round(max(0, min(100, vision_score)), 2)
        
        interpretation = self.get_interpretation(vision_score)
        
        return {
            "reading_accuracy": accuracy,
            "behavioral_stability": stability,
            "movement_score": movement_speed,
            "final_vision_disability_score": vision_score,
            "interpretation": interpretation
        }

    def get_interpretation(self, score: float) -> str:
        if score >= 90:
            return "Minimal to no visual impairment detected. Excellent reading performance and behavioral stability."
        elif score >= 75:
            return "Mild visual difficulty. Reading accuracy or stability shows slight deviations from baseline."
        elif score >= 50:
            return "Moderate visual impairment. Noticeable difficulty in reading consistency and maintaining stable head position."
        elif score >= 25:
            return "Significant visual impairment. Marked difficulty in reading accuracy and behavioral tracking."
        else:
            return "Severe visual impairment. Critical difficulty in visual engagement and information processing."

text_scoring_service = TextScoringService()
