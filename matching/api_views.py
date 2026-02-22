from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods
from django.db.models import Avg, Count, Q
from django.utils import timezone
from datetime import timedelta

from accounts.api_utils import api_login_required, json_bad_request, parse_json_body
from matching.services import compute_matches_for_user
from sessions_app.models import Session, CreditLedger
from skills.models import Skill
from reviews.models import Review


@require_GET
@api_login_required
def dashboard_api(request):
    profile = request.user.profile

    # Get credit balance
    credit_balance = CreditLedger.objects.filter(profile=profile).aggregate(total=Count('delta') if not CreditLedger.objects.filter(profile=profile).exists() else 0)
    credit_total = sum(entry.delta for entry in CreditLedger.objects.filter(profile=profile))

    # Get average rating
    avg_rating = Review.objects.filter(reviewee=profile).aggregate(avg=Avg('rating'))['avg']

    # Get personal stats
    total_sessions = Session.objects.filter(Q(teacher=profile) | Q(learner=profile)).count()
    completed_sessions = Session.objects.filter(Q(teacher=profile) | Q(learner=profile), status=Session.STATUS_COMPLETED).count()
    reviews_received = Review.objects.filter(reviewee=profile).count()

    # Get sessions chart (breakdown of session statuses)
    session_statuses = {}
    for status_code, status_label in Session.STATUS_CHOICES:
        count = Session.objects.filter(Q(teacher=profile) | Q(learner=profile), status=status_code).count()
        session_statuses[status_label] = count

    # Get credits chart (credit changes by month for last 12 months)
    credits_by_month = {}
    today = timezone.now()
    for i in range(12):
        month_date = today - timedelta(days=30*i)
        month_key = month_date.strftime('%b')
        month_start = month_date.replace(day=1)
        if i == 0:
            month_end = today
        else:
            month_end = (month_date.replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)

        month_total = sum(
            entry.delta for entry in CreditLedger.objects.filter(
                profile=profile,
                created_at__gte=month_start,
                created_at__lte=month_end
            )
        )
        credits_by_month[month_key] = month_total

    # Get upcoming sessions (requested or accepted)
    upcoming_learning = Session.objects.filter(
        learner=profile,
        status__in=[Session.STATUS_REQUESTED, Session.STATUS_ACCEPTED]
    ).select_related('teacher', 'skill').values(
        'id', 'skill__name', 'teacher__full_name', 'status', 'scheduled_at'
    )

    upcoming_teaching = Session.objects.filter(
        teacher=profile,
        status__in=[Session.STATUS_REQUESTED, Session.STATUS_ACCEPTED]
    ).select_related('learner', 'skill').values(
        'id', 'skill__name', 'learner__full_name', 'status', 'scheduled_at'
    )

    # Format upcoming sessions
    learning_list = [
        {
            'id': s['id'],
            'skill': s['skill__name'],
            'partner': s['teacher__full_name'],
            'status': s['status'],
            'scheduled_at': s['scheduled_at'].isoformat() if s['scheduled_at'] else None,
        }
        for s in upcoming_learning
    ]

    teaching_list = [
        {
            'id': s['id'],
            'skill': s['skill__name'],
            'partner': s['learner__full_name'],
            'status': s['status'],
            'scheduled_at': s['scheduled_at'].isoformat() if s['scheduled_at'] else None,
        }
        for s in upcoming_teaching
    ]

    # Get offered and wanted skills
    offered_skills = list(profile.offered_skills.values_list('skill__name', flat=True))
    wanted_skills = list(profile.wanted_skills.values_list('skill__name', flat=True))

    payload = {
        'profile': {
            'full_name': profile.full_name,
            'bio': profile.bio,
            'timezone': profile.timezone,
            'languages': profile.languages,
            'level': profile.level,
            'offered_skills': offered_skills,
            'wanted_skills': wanted_skills,
        },
        'credit_balance': credit_total,
        'rating': avg_rating,
        'personal_stats': {
            'total_sessions': total_sessions,
            'completed_sessions': completed_sessions,
            'reviews_received': reviews_received,
        },
        'sessions_chart': {
            'labels': list(session_statuses.keys()),
            'values': list(session_statuses.values()),
        },
        'credits_chart': {
            'labels': list(sorted(credits_by_month.keys(), reverse=True)[:12]),
            'values': [credits_by_month[month] for month in sorted(credits_by_month.keys(), reverse=True)[:12]],
        },
        'upcoming_learning': learning_list,
        'upcoming_teaching': teaching_list,
    }

    return JsonResponse(payload)


@require_GET
@api_login_required
def matches_api(request):
    profile = request.user.profile
    matches = compute_matches_for_user(profile)

    payload = [
        {
            'profile_id': m['profile'].id,
            'name': m['profile'].full_name,
            'bio': m['profile'].bio,
            'level': m['profile'].level,
            'timezone': m['profile'].timezone,
            'languages': m['profile'].languages,
            'score': m['score'],
            'reasons': m['reasons'],
            'reciprocal_skills': m['reciprocal_skills'],
            'offered_skills': m['offered_skills'],
            'wanted_skills': m['wanted_skills'],
        }
        for m in matches
    ]

    return JsonResponse({'matches': payload})


@csrf_exempt
@require_http_methods(['POST'])
@api_login_required
def request_session_api(request, profile_id):
    data = parse_json_body(request)
    if data is None:
        return json_bad_request('Invalid JSON payload.')

    skill_id = data.get('skill_id')
    if not skill_id:
        return json_bad_request('skill_id is required.')

    learner = request.user.profile
    teacher = get_object_or_404(learner.__class__, id=profile_id)
    skill = get_object_or_404(Skill, id=skill_id)

    if not teacher.offered_skills.filter(skill_id=skill.id).exists():
        return json_bad_request('Selected skill is not offered by this user.')

    session = Session.objects.create(teacher=teacher, learner=learner, skill=skill, status=Session.STATUS_REQUESTED)
    return JsonResponse({'ok': True, 'session_id': session.id}, status=201)
