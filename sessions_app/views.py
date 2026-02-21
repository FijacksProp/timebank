from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.shortcuts import get_object_or_404, redirect, render

from matching.services import get_credit_balance
from reviews.models import Review
from sessions_app.models import CreditLedger, Session


@login_required
def sessions_list(request):
    profile = request.user.profile
    as_learner = profile.sessions_as_learner.all().order_by('-created_at')
    as_teacher = profile.sessions_as_teacher.all().order_by('-created_at')
    return render(request, 'sessions/list.html', {'as_learner': as_learner, 'as_teacher': as_teacher})


@login_required
def session_detail(request, session_id):
    profile = request.user.profile
    session = get_object_or_404(Session, id=session_id)

    if profile.id not in (session.teacher_id, session.learner_id):
        return redirect('sessions_list')

    already_reviewed = Review.objects.filter(session=session, reviewer=profile).exists()

    return render(
        request,
        'sessions/detail.html',
        {
            'session': session,
            'is_teacher': session.teacher_id == profile.id,
            'credit_balance': get_credit_balance(profile),
            'already_reviewed': already_reviewed,
        },
    )


@login_required
@transaction.atomic
def accept_session(request, session_id):
    profile = request.user.profile
    session = get_object_or_404(Session, id=session_id, teacher=profile)
    session.status = Session.STATUS_ACCEPTED
    session.meeting_link = request.POST.get('meeting_link', '')
    session.save(update_fields=['status', 'meeting_link'])
    return redirect('session_detail', session_id=session.id)


@login_required
def decline_session(request, session_id):
    profile = request.user.profile
    session = get_object_or_404(Session, id=session_id, teacher=profile)
    session.status = Session.STATUS_DECLINED
    session.save(update_fields=['status'])
    return redirect('session_detail', session_id=session.id)


@login_required
@transaction.atomic
def complete_session(request, session_id):
    profile = request.user.profile
    session = get_object_or_404(Session, id=session_id)

    if session.status == Session.STATUS_COMPLETED:
        messages.error(request, 'Session already completed.')
        return redirect('session_detail', session_id=session.id)

    if profile.id not in (session.teacher_id, session.learner_id):
        return redirect('sessions_list')

    learner_balance = get_credit_balance(session.learner)
    if learner_balance < 1:
        messages.error(request, 'Learner has insufficient credits.')
        return redirect('session_detail', session_id=session.id)

    session.status = Session.STATUS_COMPLETED
    session.save(update_fields=['status'])

    CreditLedger.objects.create(
        profile=session.teacher,
        delta=1,
        reason=CreditLedger.REASON_TEACHING,
        session=session,
    )
    CreditLedger.objects.create(
        profile=session.learner,
        delta=-1,
        reason=CreditLedger.REASON_LEARNING,
        session=session,
    )

    return redirect('session_detail', session_id=session.id)


@login_required
def submit_review(request, session_id):
    profile = request.user.profile
    session = get_object_or_404(Session, id=session_id, status=Session.STATUS_COMPLETED)

    if profile.id not in (session.teacher_id, session.learner_id):
        return redirect('sessions_list')

    reviewee = session.learner if session.teacher_id == profile.id else session.teacher
    rating = int(request.POST.get('rating', 0))
    comment = request.POST.get('comment', '').strip()

    if rating < 1 or rating > 5:
        messages.error(request, 'Rating must be between 1 and 5.')
        return redirect('session_detail', session_id=session.id)

    Review.objects.update_or_create(
        session=session,
        reviewer=profile,
        defaults={
            'reviewee': reviewee,
            'rating': rating,
            'comment': comment,
        },
    )

    return redirect('session_detail', session_id=session.id)
