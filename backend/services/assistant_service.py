def decide_assistant(domain_scores):
    assistants = []

    if domain_scores["vision"] < 70:
        assistants.append("Vision Assistant")

    if domain_scores["hearing"] < 70:
        assistants.append("Hearing Assistant")

    if domain_scores["cognitive"] < 70:
        assistants.append("Cognitive Assistant")

    if not assistants:
        return "No Assistant Needed"

    if len(assistants) == 1:
        return assistants[0]

    return "Multi-Assist Mode"