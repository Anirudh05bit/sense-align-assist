def calculate_domain_scores(data):
    domain_scores = {}

    for domain, tests in data.items():
        avg = sum(tests.values()) / len(tests)
        domain_scores[domain] = round(avg, 2)

    return domain_scores


def generate_report(data):
    return {
        "domain_scores": calculate_domain_scores(data),
        "detailed_scores": data
    }