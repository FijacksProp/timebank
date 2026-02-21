from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LoginView, LogoutView
from django.db.models import Avg
from django.shortcuts import redirect, render

from accounts.forms import OnboardingForm, SignUpForm
from accounts.models import Profile
from matching.services import get_credit_balance
from skills.models import ProfileSkillOffered, ProfileSkillWanted, Skill


def landing(request):
    return render(request, 'landing.html')


def signup_view(request):
    if request.method == 'POST':
        form = SignUpForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('onboarding')
    else:
        form = SignUpForm()
    return render(request, 'auth/signup.html', {'form': form})


class AppLoginView(LoginView):
    template_name = 'auth/login.html'


class AppLogoutView(LogoutView):
    pass


@login_required
def onboarding(request):
    profile = getattr(request.user, 'profile', None)

    if request.method == 'POST':
        form = OnboardingForm(request.POST)
        if form.is_valid():
            profile, _ = Profile.objects.get_or_create(user=request.user)
            profile.full_name = form.cleaned_data['full_name']
            profile.bio = form.cleaned_data['bio']
            profile.timezone = form.cleaned_data['timezone']
            profile.languages = form.cleaned_data['languages']
            profile.level = form.cleaned_data['level']
            profile.save()

            ProfileSkillOffered.objects.filter(profile=profile).delete()
            ProfileSkillWanted.objects.filter(profile=profile).delete()

            offered_names = [name.strip() for name in form.cleaned_data['offered_skills'].split(',') if name.strip()]
            wanted_names = [name.strip() for name in form.cleaned_data['wanted_skills'].split(',') if name.strip()]

            for name in offered_names:
                skill, _ = Skill.objects.get_or_create(name=name)
                ProfileSkillOffered.objects.create(profile=profile, skill=skill, level=profile.level)

            for name in wanted_names:
                skill, _ = Skill.objects.get_or_create(name=name)
                ProfileSkillWanted.objects.create(profile=profile, skill=skill, target_level=profile.level)

            from sessions_app.models import CreditLedger

            if not profile.credit_entries.exists():
                CreditLedger.objects.create(profile=profile, delta=3, reason=CreditLedger.REASON_SIGNUP)

            return redirect('dashboard')
    else:
        initial = {}
        if profile:
            initial = {
                'full_name': profile.full_name,
                'bio': profile.bio,
                'timezone': profile.timezone,
                'languages': profile.languages,
                'level': profile.level,
                'offered_skills': ', '.join(profile.offered_skills.values_list('skill__name', flat=True)),
                'wanted_skills': ', '.join(profile.wanted_skills.values_list('skill__name', flat=True)),
            }
        form = OnboardingForm(initial=initial)

    return render(request, 'onboarding.html', {'form': form})


@login_required
def dashboard(request):
    profile = getattr(request.user, 'profile', None)
    if not profile:
        return redirect('onboarding')

    upcoming = profile.sessions_as_learner.filter(status='accepted').order_by('scheduled_at')[:3]
    teaching = profile.sessions_as_teacher.filter(status='accepted').order_by('scheduled_at')[:3]
    rating = profile.reviews_received.aggregate(avg=Avg('rating'))['avg']

    return render(
        request,
        'dashboard.html',
        {
            'profile': profile,
            'credit_balance': get_credit_balance(profile),
            'upcoming': upcoming,
            'teaching': teaching,
            'rating': rating,
        },
    )
