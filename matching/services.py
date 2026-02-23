from django.db.models import Avg, Q, Sum

from accounts.models import Profile
from sessions_app.models import Session
from skills.models import ProfileSkillOffered, ProfileSkillWanted, Skill


def level_distance(level_a: str, level_b: str) -> int:
    order = {'beginner': 0, 'intermediate': 1, 'advanced': 2}
    return abs(order.get(level_a, 0) - order.get(level_b, 0))


def compute_matches_for_user(profile: Profile):
    my_wanted = list(ProfileSkillWanted.objects.filter(profile=profile).select_related('skill'))
    my_offered = list(ProfileSkillOffered.objects.filter(profile=profile).select_related('skill'))

    if not my_wanted and not my_offered:
        return []

    candidates = Profile.objects.exclude(id=profile.id)
    results = []

    my_wanted_ids = {entry.skill_id for entry in my_wanted}
    my_offered_ids = {entry.skill_id for entry in my_offered}

    for candidate in candidates:
        cand_offered = list(ProfileSkillOffered.objects.filter(profile=candidate))
        cand_wanted = list(ProfileSkillWanted.objects.filter(profile=candidate))

        cand_offered_ids = {entry.skill_id for entry in cand_offered}
        cand_wanted_ids = {entry.skill_id for entry in cand_wanted}

        reciprocal_a = my_wanted_ids.intersection(cand_offered_ids)
        reciprocal_b = my_offered_ids.intersection(cand_wanted_ids)
        reciprocal_ids = sorted(list(reciprocal_a))
        reciprocal_count = min(len(reciprocal_a), len(reciprocal_b))
        reciprocal_score = min(40, reciprocal_count * 20)

        tz_score = 20 if profile.timezone == candidate.timezone else 10
        lvl_score = max(0, 15 - (level_distance(profile.level, candidate.level) * 5))

        lang_overlap = len(profile.language_set().intersection(candidate.language_set()))
        lang_score = min(15, lang_overlap * 7)

        rating_avg = candidate.reviews_received.aggregate(avg=Avg('rating'))['avg'] or 0
        confidence_score = min(10, int(rating_avg * 2))

        total = reciprocal_score + tz_score + lvl_score + lang_score + confidence_score

        if total == 0:
            continue

        reciprocal_skills = list(Skill.objects.filter(id__in=reciprocal_ids).values('id', 'name').order_by('name'))
        offered_skills = list(Skill.objects.filter(id__in=sorted(list(cand_offered_ids))).values('id', 'name').order_by('name'))
        wanted_skills = list(Skill.objects.filter(id__in=sorted(list(cand_wanted_ids))).values('id', 'name').order_by('name'))

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

        completed_sessions = Session.objects.filter(
            Q(teacher=candidate) | Q(learner=candidate),
            status=Session.STATUS_COMPLETED,
        ).count()
        hours_traded = Session.objects.filter(
            Q(teacher=candidate) | Q(learner=candidate),
            status=Session.STATUS_COMPLETED,
        ).aggregate(total=Sum('duration_min'))['total'] or 0
        hours_traded = round(hours_traded / 60, 1)
        credit_balance = candidate.credit_entries.aggregate(total=Sum('delta'))['total'] or 0
        rating_avg_rounded = round(float(rating_avg), 1) if rating_avg else 0.0

        top_skill = reciprocal_skills[0]['name'] if reciprocal_skills else (
            offered_skills[0]['name'] if offered_skills else "General skills"
        )
        tz_note = "same timezone" if profile.timezone == candidate.timezone else "timezone overlap"
        match_blurb = f"Shared skill: {top_skill} • {total}% match • {tz_note}"

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
                    'completed_sessions': completed_sessions,
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
