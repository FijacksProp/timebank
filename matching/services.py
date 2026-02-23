from collections import defaultdict

from django.db.models import Avg, Q, Sum

from accounts.models import Profile
from reviews.models import Review
from sessions_app.models import CreditLedger, Session
from skills.models import ProfileSkillOffered, ProfileSkillWanted, Skill


def level_distance(level_a: str, level_b: str) -> int:
    order = {'beginner': 0, 'intermediate': 1, 'advanced': 2}
    return abs(order.get(level_a, 0) - order.get(level_b, 0))


def compute_matches_for_user(profile: Profile):
    my_wanted = list(ProfileSkillWanted.objects.filter(profile=profile).select_related('skill'))
    my_offered = list(ProfileSkillOffered.objects.filter(profile=profile).select_related('skill'))

    if not my_wanted and not my_offered:
        return []

    candidates = list(Profile.objects.exclude(id=profile.id))
    if not candidates:
        return []

    candidate_ids = [candidate.id for candidate in candidates]
    results = []

    my_wanted_ids = {entry.skill_id for entry in my_wanted}
    my_offered_ids = {entry.skill_id for entry in my_offered}

    offered_entries = ProfileSkillOffered.objects.filter(profile_id__in=candidate_ids).select_related('skill')
    wanted_entries = ProfileSkillWanted.objects.filter(profile_id__in=candidate_ids).select_related('skill')

    offered_ids_by_profile = defaultdict(set)
    wanted_ids_by_profile = defaultdict(set)
    all_skill_ids = set()

    for entry in offered_entries:
        offered_ids_by_profile[entry.profile_id].add(entry.skill_id)
        all_skill_ids.add(entry.skill_id)

    for entry in wanted_entries:
        wanted_ids_by_profile[entry.profile_id].add(entry.skill_id)
        all_skill_ids.add(entry.skill_id)

    skill_name_map = {row['id']: row['name'] for row in Skill.objects.filter(id__in=all_skill_ids).values('id', 'name')}

    rating_map = {
        row['reviewee_id']: float(row['avg_rating'] or 0.0)
        for row in Review.objects.filter(reviewee_id__in=candidate_ids).values('reviewee_id').annotate(avg_rating=Avg('rating'))
    }

    credit_map = {
        row['profile_id']: int(row['total'] or 0)
        for row in CreditLedger.objects.filter(profile_id__in=candidate_ids).values('profile_id').annotate(total=Sum('delta'))
    }

    completed_stats = defaultdict(lambda: {'count': 0, 'duration_min': 0})
    completed_sessions = Session.objects.filter(
        status=Session.STATUS_COMPLETED
    ).filter(Q(teacher_id__in=candidate_ids) | Q(learner_id__in=candidate_ids)).values('teacher_id', 'learner_id', 'duration_min')

    for row in completed_sessions:
        duration = int(row['duration_min'] or 0)
        teacher_id = row['teacher_id']
        learner_id = row['learner_id']

        completed_stats[teacher_id]['count'] += 1
        completed_stats[teacher_id]['duration_min'] += duration

        if learner_id != teacher_id:
            completed_stats[learner_id]['count'] += 1
            completed_stats[learner_id]['duration_min'] += duration

    for candidate in candidates:
        cand_offered_ids = offered_ids_by_profile.get(candidate.id, set())
        cand_wanted_ids = wanted_ids_by_profile.get(candidate.id, set())

        reciprocal_a = my_wanted_ids.intersection(cand_offered_ids)
        reciprocal_b = my_offered_ids.intersection(cand_wanted_ids)
        reciprocal_ids = sorted(list(reciprocal_a))
        reciprocal_count = min(len(reciprocal_a), len(reciprocal_b))
        reciprocal_score = min(40, reciprocal_count * 20)

        tz_score = 20 if profile.timezone == candidate.timezone else 10
        lvl_score = max(0, 15 - (level_distance(profile.level, candidate.level) * 5))

        lang_overlap = len(profile.language_set().intersection(candidate.language_set()))
        lang_score = min(15, lang_overlap * 7)

        rating_avg = rating_map.get(candidate.id, 0.0)
        confidence_score = min(10, int(rating_avg * 2))

        total = reciprocal_score + tz_score + lvl_score + lang_score + confidence_score
        if total == 0:
            continue

        reciprocal_skills = [{'id': sid, 'name': skill_name_map.get(sid, f'Skill {sid}')} for sid in sorted(reciprocal_ids)]
        offered_skills = [{'id': sid, 'name': skill_name_map.get(sid, f'Skill {sid}')} for sid in sorted(cand_offered_ids)]
        wanted_skills = [{'id': sid, 'name': skill_name_map.get(sid, f'Skill {sid}')} for sid in sorted(cand_wanted_ids)]

        reasons = []
        if reciprocal_count:
            reasons.append('Reciprocal skill needs detected')
        if tz_score >= 10:
            reasons.append('Good timezone compatibility')
        if lvl_score >= 10:
            reasons.append('Similar experience level')
        if lang_overlap:
            reasons.append('Shared language(s)')
        if confidence_score:
            reasons.append('Strong review history')

        candidate_stats = completed_stats.get(candidate.id, {'count': 0, 'duration_min': 0})
        completed_sessions_count = candidate_stats['count']
        hours_traded = round((candidate_stats['duration_min'] or 0) / 60, 1)
        credit_balance = credit_map.get(candidate.id, 0)
        rating_avg_rounded = round(float(rating_avg), 1) if rating_avg else 0.0

        top_skill = reciprocal_skills[0]['name'] if reciprocal_skills else (
            offered_skills[0]['name'] if offered_skills else "General skills"
        )
        tz_note = "same timezone" if profile.timezone == candidate.timezone else "timezone overlap"
        match_blurb = f"Shared skill: {top_skill} | {total}% match | {tz_note}"

        results.append(
            {
                'profile': candidate,
                'score': total,
                'reasons': reasons[:5],
                'match_blurb': match_blurb,
                'match_details': {
                    'shared_skill': top_skill,
                    'score_percent': total,
                    'timezone_note': tz_note,
                },
                'reciprocal_skills': reciprocal_skills,
                'offered_skills': offered_skills,
                'wanted_skills': wanted_skills,
                'profile_stats': {
                    'hours_traded': hours_traded,
                    'completed_sessions': completed_sessions_count,
                    'reputation_score': int(round(rating_avg_rounded * 20)),
                    'rating_avg': rating_avg_rounded,
                    'credit_balance': credit_balance,
                },
            }
        )

    return sorted(results, key=lambda item: item['score'], reverse=True)


def get_credit_balance(profile: Profile) -> int:
    total = profile.credit_entries.aggregate(total=Sum('delta'))['total']
    return total or 0
