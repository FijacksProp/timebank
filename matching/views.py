from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render

from matching.services import compute_matches_for_user
from sessions_app.models import Session
from skills.models import Skill


@login_required
def matches_view(request):
    profile = getattr(request.user, 'profile', None)
    if not profile:
        return redirect('onboarding')

    matches = compute_matches_for_user(profile)
    return render(request, 'matches.html', {'matches': matches})


@login_required
def request_session(request, profile_id):
    me = request.user.profile
    teacher = me.__class__.objects.get(id=profile_id)

    if request.method == 'POST':
        skill_id = request.POST.get('skill_id')
        skill = Skill.objects.get(id=skill_id)
        Session.objects.create(teacher=teacher, learner=me, skill=skill, status=Session.STATUS_REQUESTED)
        return redirect('sessions_list')

    return redirect('matches')
