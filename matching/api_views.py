from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods
from django.db.models import Avg, Count, Q, Sum
from django.utils import timezone
from datetime import timedelta
import logging

from accounts.api_utils import api_login_required, json_bad_request, parse_json_body
from matching.services import compute_matches_for_user
from sessions_app.models import Session, CreditLedger
from skills.models import Skill
from reviews.models import Review

logger = logging.getLogger(__name__)


@require_GET
@api_login_required
def dashboard_api(request):
    profile = request.user.profile
    ledgers_qs = CreditLedger.objects.filter(profile=profile).order_by('created_at')

    # Credit totals
    credit_total = ledgers_qs.aggregate(total=Sum('delta'))['total'] or 0
    earned_total = ledgers_qs.filter(delta__gt=0).aggregate(total=Sum('delta'))['total'] or 0
    used_total_raw = ledgers_qs.filter(delta__lt=0).aggregate(total=Sum('delta'))['total'] or 0
    used_total = abs(used_total_raw)

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

    # Get credits chart (monthly delta for last 12 months)
    credits_by_month = {}
    today = timezone.now()
    month_windows = []
    for i in range(11, -1, -1):
        month_date = (today.replace(day=15) - timedelta(days=30 * i))
        month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if month_start.month == 12:
            month_end = month_start.replace(year=month_start.year + 1, month=1)
        else:
            month_end = month_start.replace(month=month_start.month + 1)
        month_key = month_start.strftime('%b')
        month_windows.append((month_key, month_start, month_end))

    for month_key, month_start, month_end in month_windows:
        month_total = ledgers_qs.filter(created_at__gte=month_start, created_at__lt=month_end).aggregate(total=Sum('delta'))['total'] or 0
        credits_by_month[month_key] = month_total

    # Balance chart (running balance over same 12-month window)
    first_month_start = month_windows[0][1]
    pre_window_total = ledgers_qs.filter(created_at__lt=first_month_start).aggregate(total=Sum('delta'))['total'] or 0
    running = pre_window_total
    balance_points = []
    for month_key, _, _ in month_windows:
        running += credits_by_month[month_key]
        balance_points.append({'month': month_key, 'balance': running})

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

    # Community feed (recent activity)
    activities = []

    recent_sessions = Session.objects.select_related('teacher', 'learner', 'skill').order_by('-created_at')[:8]
    for session in recent_sessions:
        if session.status == Session.STATUS_COMPLETED:
            text = f"{session.teacher.full_name} completed teaching {session.skill.name} to {session.learner.full_name}."
        elif session.status == Session.STATUS_ACCEPTED:
            text = f"{session.teacher.full_name} accepted a {session.skill.name} session with {session.learner.full_name}."
        else:
            text = f"{session.learner.full_name} requested {session.skill.name} from {session.teacher.full_name}."
        activities.append({'type': 'session', 'text': text, 'created_at': session.created_at})

    recent_credits = CreditLedger.objects.select_related('profile').order_by('-created_at')[:8]
    for entry in recent_credits:
        direction = "earned" if entry.delta > 0 else "spent"
        text = f"{entry.profile.full_name} {direction} {abs(entry.delta)} credit{'s' if abs(entry.delta) != 1 else ''}."
        activities.append({'type': 'credit', 'text': text, 'created_at': entry.created_at})

    recent_reviews = Review.objects.select_related('reviewer', 'reviewee').order_by('-created_at')[:8]
    for review in recent_reviews:
        text = f"{review.reviewer.full_name} rated {review.reviewee.full_name} {review.rating}/5."
        activities.append({'type': 'review', 'text': text, 'created_at': review.created_at})

    activities.sort(key=lambda item: item['created_at'], reverse=True)
    recent_activity = [
        {
            'type': item['type'],
            'text': item['text'],
            'created_at': item['created_at'].isoformat(),
        }
        for item in activities[:12]
    ]

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
        'credit_stats': {
            'earned_total': earned_total,
            'used_total': used_total,
            'current_balance': credit_total,
        },
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
            'labels': [m[0] for m in month_windows],
            'values': [credits_by_month[m[0]] for m in month_windows],
        },
        'balance_chart': {
            'labels': [point['month'] for point in balance_points],
            'values': [point['balance'] for point in balance_points],
        },
        'upcoming_learning': learning_list,
        'upcoming_teaching': teaching_list,
        'recent_activity': recent_activity,
    }

    return JsonResponse(payload)


@require_GET
@api_login_required
def matches_api(request):
    profile = request.user.profile
    try:
        matches = compute_matches_for_user(profile)
    except Exception:
        logger.exception("matches_api failed for profile_id=%s", profile.id)
        return JsonResponse({'matches': [], 'warning': 'match_engine_temporarily_unavailable'})

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
            'match_blurb': m['match_blurb'],
            'match_details': m['match_details'],
            'reciprocal_skills': m['reciprocal_skills'],
            'offered_skills': m['offered_skills'],
            'wanted_skills': m['wanted_skills'],
            'profile_stats': m['profile_stats'],
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
