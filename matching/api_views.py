from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from accounts.api_utils import api_login_required, json_bad_request, parse_json_body
from matching.services import compute_matches_for_user
from sessions_app.models import Session
from skills.models import Skill


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

    session = Session.objects.create(teacher=teacher, learner=learner, skill=skill, status=Session.STATUS_REQUESTED)
    return JsonResponse({'ok': True, 'session_id': session.id}, status=201)
