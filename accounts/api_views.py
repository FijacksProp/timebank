import json

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import Avg, Count, Q
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from accounts.api_utils import api_login_required, json_bad_request, parse_json_body
from accounts.models import Profile
from matching.services import get_credit_balance
from sessions_app.models import CreditLedger, Session
from skills.models import ProfileSkillOffered, ProfileSkillWanted, Skill


def _profile_payload(profile: Profile):
    return {
        'id': profile.id,
        'username': profile.user.username,
        'email': profile.user.email,
        'full_name': profile.full_name,
        'bio': profile.bio,
        'timezone': profile.timezone,
        'languages': profile.languages,
        'level': profile.level,
        'offered_skills': list(profile.offered_skills.values_list('skill__name', flat=True)),
        'wanted_skills': list(profile.wanted_skills.values_list('skill__name', flat=True)),
    }


@csrf_exempt
@require_http_methods(['POST'])
def signup_api(request):
    data = parse_json_body(request)
    if data is None:
        return json_bad_request('Invalid JSON payload.')

    username = (data.get('username') or '').strip()
    email = (data.get('email') or '').strip()
    password = data.get('password') or ''
    full_name = (data.get('full_name') or '').strip()

    if not username or not password or not full_name:
        return json_bad_request('username, password, and full_name are required.')

    if User.objects.filter(username=username).exists():
        return json_bad_request('Username already exists.')

    user = User.objects.create_user(username=username, email=email, password=password)
    profile = Profile.objects.create(user=user, full_name=full_name)
    CreditLedger.objects.create(profile=profile, delta=3, reason=CreditLedger.REASON_SIGNUP)
    login(request, user)

    return JsonResponse({'ok': True, 'profile': _profile_payload(profile)}, status=201)


@csrf_exempt
@require_http_methods(['POST'])
def login_api(request):
    data = parse_json_body(request)
    if data is None:
        return json_bad_request('Invalid JSON payload.')

    username = (data.get('username') or '').strip()
    password = data.get('password') or ''

    if not username or not password:
        return json_bad_request('username and password are required.')

    user = authenticate(request, username=username, password=password)
    if not user:
        return JsonResponse({'detail': 'Invalid credentials.'}, status=401)

    login(request, user)
    profile, _ = Profile.objects.get_or_create(user=user, defaults={'full_name': user.username})
    return JsonResponse({'ok': True, 'profile': _profile_payload(profile)})


@csrf_exempt
@require_http_methods(['POST'])
@api_login_required
def logout_api(request):
    logout(request)
    return JsonResponse({'ok': True})


@require_GET
@api_login_required
def me_api(request):
    profile, _ = Profile.objects.get_or_create(user=request.user, defaults={'full_name': request.user.username})
    return JsonResponse({'authenticated': True, 'profile': _profile_payload(profile)})


@csrf_exempt
@require_http_methods(['GET', 'POST'])
@api_login_required
def onboarding_api(request):
    profile, _ = Profile.objects.get_or_create(user=request.user, defaults={'full_name': request.user.username})

    if request.method == 'GET':
        return JsonResponse({'profile': _profile_payload(profile)})

    data = parse_json_body(request)
    if data is None:
        return json_bad_request('Invalid JSON payload.')

    profile.full_name = (data.get('full_name') or profile.full_name).strip() or profile.full_name
    profile.bio = data.get('bio', profile.bio) or ''
    profile.timezone = data.get('timezone', profile.timezone) or 'UTC'
    profile.languages = data.get('languages', profile.languages) or ''
    profile.level = data.get('level', profile.level) or 'beginner'
    profile.save()

    offered_names = data.get('offered_skills', [])
    wanted_names = data.get('wanted_skills', [])

    if isinstance(offered_names, str):
        offered_names = [s.strip() for s in offered_names.split(',') if s.strip()]
    if isinstance(wanted_names, str):
        wanted_names = [s.strip() for s in wanted_names.split(',') if s.strip()]

    ProfileSkillOffered.objects.filter(profile=profile).delete()
    ProfileSkillWanted.objects.filter(profile=profile).delete()

    for name in offered_names:
        skill, _ = Skill.objects.get_or_create(name=name)
        ProfileSkillOffered.objects.create(profile=profile, skill=skill, level=profile.level)

    for name in wanted_names:
        skill, _ = Skill.objects.get_or_create(name=name)
        ProfileSkillWanted.objects.create(profile=profile, skill=skill, target_level=profile.level)

    if not profile.credit_entries.exists():
        CreditLedger.objects.create(profile=profile, delta=3, reason=CreditLedger.REASON_SIGNUP)

    return JsonResponse({'ok': True, 'profile': _profile_payload(profile)})


@require_GET
@api_login_required
def dashboard_api(request):
    profile, _ = Profile.objects.get_or_create(user=request.user, defaults={'full_name': request.user.username})

    upcoming = profile.sessions_as_learner.filter(status=Session.STATUS_ACCEPTED).order_by('scheduled_at')[:3]
    teaching = profile.sessions_as_teacher.filter(status=Session.STATUS_ACCEPTED).order_by('scheduled_at')[:3]
    rating = profile.reviews_received.aggregate(avg=Avg('rating'))['avg']

    my_sessions = Session.objects.filter(Q(teacher=profile) | Q(learner=profile))

    status_order = [
        Session.STATUS_REQUESTED,
        Session.STATUS_ACCEPTED,
        Session.STATUS_DECLINED,
        Session.STATUS_COMPLETED,
        Session.STATUS_CANCELLED,
    ]
    status_map = {item['status']: item['total'] for item in my_sessions.values('status').annotate(total=Count('id'))}

    running_balance = 0
    credit_labels = []
    credit_values = []
    for entry in profile.credit_entries.order_by('created_at'):
        running_balance += entry.delta
        credit_labels.append(entry.created_at.strftime('%b %d'))
        credit_values.append(running_balance)

    if not credit_labels:
        credit_labels = ['Now']
        credit_values = [0]

    payload = {
        'profile': _profile_payload(profile),
        'credit_balance': get_credit_balance(profile),
        'rating': rating,
        'personal_stats': {
            'total_sessions': my_sessions.count(),
            'completed_sessions': my_sessions.filter(status=Session.STATUS_COMPLETED).count(),
            'reviews_received': profile.reviews_received.count(),
        },
        'sessions_chart': {
            'labels': [s.replace('_', ' ').title() for s in status_order],
            'values': [status_map.get(s, 0) for s in status_order],
        },
        'credits_chart': {
            'labels': credit_labels[-12:],
            'values': credit_values[-12:],
        },
        'upcoming_learning': [
            {
                'id': s.id,
                'skill': s.skill.name,
                'partner': s.teacher.full_name,
                'status': s.status,
                'scheduled_at': s.scheduled_at.isoformat() if s.scheduled_at else None,
            }
            for s in upcoming
        ],
        'upcoming_teaching': [
            {
                'id': s.id,
                'skill': s.skill.name,
                'partner': s.learner.full_name,
                'status': s.status,
                'scheduled_at': s.scheduled_at.isoformat() if s.scheduled_at else None,
            }
            for s in teaching
        ],
    }

    return JsonResponse(payload)
