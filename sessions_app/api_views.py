from datetime import timedelta
import secrets

from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from accounts.api_utils import api_login_required, json_bad_request, parse_json_body
from matching.services import get_credit_balance
from reviews.models import Review
from sessions_app.models import CreditLedger, Session, SessionMessage


def _session_payload(session, viewer):
    partner = session.teacher if viewer.id == session.learner_id else session.learner
    now = timezone.now()
    duration_elapsed = False
    if session.scheduled_at:
        duration_elapsed = now >= (session.scheduled_at + timedelta(minutes=session.duration_min))

    return {
        'id': session.id,
        'skill': {'id': session.skill_id, 'name': session.skill.name},
        'teacher': {'id': session.teacher_id, 'name': session.teacher.full_name},
        'learner': {'id': session.learner_id, 'name': session.learner.full_name},
        'partner': {'id': partner.id, 'name': partner.full_name},
        'status': session.status,
        'scheduled_at': session.scheduled_at.isoformat() if session.scheduled_at else None,
        'duration_min': session.duration_min,
        'meeting_link': session.meeting_link,
        'teacher_confirmed_complete': bool(session.teacher_confirmed_complete_at),
        'learner_confirmed_complete': bool(session.learner_confirmed_complete_at),
        'duration_elapsed': duration_elapsed,
        'created_at': session.created_at.isoformat(),
    }


@require_GET
@api_login_required
def sessions_list_api(request):
    profile = request.user.profile
    as_learner = profile.sessions_as_learner.select_related('skill', 'teacher').order_by('-created_at')
    as_teacher = profile.sessions_as_teacher.select_related('skill', 'learner').order_by('-created_at')

    return JsonResponse(
        {
            'as_learner': [_session_payload(s, profile) for s in as_learner],
            'as_teacher': [_session_payload(s, profile) for s in as_teacher],
        }
    )


@require_GET
@api_login_required
def session_detail_api(request, session_id):
    profile = request.user.profile
    session = get_object_or_404(Session.objects.select_related('skill', 'teacher', 'learner'), id=session_id)

    if profile.id not in (session.teacher_id, session.learner_id):
        return JsonResponse({'detail': 'Forbidden.'}, status=403)

    already_reviewed = Review.objects.filter(session=session, reviewer=profile).exists()

    return JsonResponse(
        {
            'session': _session_payload(session, profile),
            'is_teacher': session.teacher_id == profile.id,
            'credit_balance': get_credit_balance(profile),
            'already_reviewed': already_reviewed,
            'chat': [
                {
                    'id': msg.id,
                    'sender_id': msg.sender_id,
                    'sender_name': msg.sender.full_name,
                    'message': msg.message,
                    'created_at': msg.created_at.isoformat(),
                }
                for msg in session.messages.select_related('sender').all()
            ],
        }
    )


@csrf_exempt
@require_http_methods(['POST'])
@api_login_required
@transaction.atomic
def accept_session_api(request, session_id):
    profile = request.user.profile
    session = get_object_or_404(Session, id=session_id, teacher=profile)
    data = parse_json_body(request)
    if data is None:
        data = {}

    scheduled_at_raw = (data.get('scheduled_at') or '').strip()
    duration_min = data.get('duration_min', session.duration_min)
    meeting_link = (data.get('meeting_link') or '').strip()

    if scheduled_at_raw:
        scheduled_at = parse_datetime(scheduled_at_raw)
        if not scheduled_at:
            return json_bad_request('scheduled_at must be a valid ISO datetime.')
        if timezone.is_naive(scheduled_at):
            scheduled_at = timezone.make_aware(scheduled_at, timezone.get_current_timezone())
        session.scheduled_at = scheduled_at
    elif not session.scheduled_at:
        return json_bad_request('scheduled_at is required to accept session.')

    try:
        duration_min = int(duration_min)
    except (TypeError, ValueError):
        return json_bad_request('duration_min must be an integer.')
    if duration_min < 15 or duration_min > 240:
        return json_bad_request('duration_min must be between 15 and 240 minutes.')

    if not meeting_link:
        room_slug = f"timebank-{session.id}-{secrets.token_hex(4)}"
        meeting_link = f"https://meet.jit.si/{room_slug}"

    session.status = Session.STATUS_ACCEPTED
    session.meeting_link = meeting_link
    session.duration_min = duration_min
    session.teacher_confirmed_complete_at = None
    session.learner_confirmed_complete_at = None
    session.save(
        update_fields=[
            'status',
            'meeting_link',
            'duration_min',
            'scheduled_at',
            'teacher_confirmed_complete_at',
            'learner_confirmed_complete_at',
        ]
    )
    return JsonResponse({'ok': True, 'session': _session_payload(session, profile)})


@csrf_exempt
@require_http_methods(['POST'])
@api_login_required
def decline_session_api(request, session_id):
    profile = request.user.profile
    session = get_object_or_404(Session, id=session_id, teacher=profile)
    session.status = Session.STATUS_DECLINED
    session.save(update_fields=['status'])
    return JsonResponse({'ok': True, 'session': _session_payload(session, profile)})


@csrf_exempt
@require_http_methods(['POST'])
@api_login_required
@transaction.atomic
def complete_session_api(request, session_id):
    profile = request.user.profile
    session = get_object_or_404(Session, id=session_id)

    return JsonResponse({'detail': 'Use confirm-complete endpoint.'}, status=405)


@csrf_exempt
@require_http_methods(['POST'])
@api_login_required
@transaction.atomic
def confirm_complete_session_api(request, session_id):
    profile = request.user.profile
    session = get_object_or_404(Session, id=session_id)

    if profile.id not in (session.teacher_id, session.learner_id):
        return JsonResponse({'detail': 'Forbidden.'}, status=403)
    if session.status == Session.STATUS_COMPLETED:
        return JsonResponse({'ok': True, 'session': _session_payload(session, profile), 'completed': True})
    if session.status != Session.STATUS_ACCEPTED:
        return json_bad_request('Session must be accepted before completion confirmation.')
    if not session.scheduled_at:
        return json_bad_request('Session must be scheduled before completion confirmation.')

    now = timezone.now()
    if now < (session.scheduled_at + timedelta(minutes=session.duration_min)):
        return json_bad_request('Session duration has not elapsed yet.')

    if profile.id == session.teacher_id and not session.teacher_confirmed_complete_at:
        session.teacher_confirmed_complete_at = now
    if profile.id == session.learner_id and not session.learner_confirmed_complete_at:
        session.learner_confirmed_complete_at = now

    completed = False
    if session.teacher_confirmed_complete_at and session.learner_confirmed_complete_at:
        learner_balance = get_credit_balance(session.learner)
        if learner_balance < 1:
            return JsonResponse({'detail': 'Learner has insufficient credits.'}, status=400)

        session.status = Session.STATUS_COMPLETED
        session.save(
            update_fields=['teacher_confirmed_complete_at', 'learner_confirmed_complete_at', 'status']
        )

        already_awarded = CreditLedger.objects.filter(
            session=session, reason=CreditLedger.REASON_TEACHING
        ).exists()
        if not already_awarded:
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
        completed = True
    else:
        session.save(update_fields=['teacher_confirmed_complete_at', 'learner_confirmed_complete_at'])

    return JsonResponse(
        {
            'ok': True,
            'completed': completed,
            'session': _session_payload(session, profile),
        }
    )


@require_GET
@api_login_required
def session_chat_api(request, session_id):
    profile = request.user.profile
    session = get_object_or_404(Session, id=session_id)
    if profile.id not in (session.teacher_id, session.learner_id):
        return JsonResponse({'detail': 'Forbidden.'}, status=403)

    messages = session.messages.select_related('sender').all()
    return JsonResponse(
        {
            'messages': [
                {
                    'id': msg.id,
                    'sender_id': msg.sender_id,
                    'sender_name': msg.sender.full_name,
                    'message': msg.message,
                    'created_at': msg.created_at.isoformat(),
                }
                for msg in messages
            ]
        }
    )


@csrf_exempt
@require_http_methods(['POST'])
@api_login_required
def send_session_chat_api(request, session_id):
    profile = request.user.profile
    session = get_object_or_404(Session, id=session_id)
    if profile.id not in (session.teacher_id, session.learner_id):
        return JsonResponse({'detail': 'Forbidden.'}, status=403)

    data = parse_json_body(request)
    if data is None:
        return json_bad_request('Invalid JSON payload.')

    message = (data.get('message') or '').strip()
    if not message:
        return json_bad_request('message is required.')
    if len(message) > 1000:
        return json_bad_request('message must be at most 1000 characters.')

    msg = SessionMessage.objects.create(session=session, sender=profile, message=message)
    return JsonResponse(
        {
            'ok': True,
            'message': {
                'id': msg.id,
                'sender_id': msg.sender_id,
                'sender_name': msg.sender.full_name,
                'message': msg.message,
                'created_at': msg.created_at.isoformat(),
            },
        },
        status=201,
    )


@csrf_exempt
@require_http_methods(['POST'])
@api_login_required
def submit_review_api(request, session_id):
    profile = request.user.profile
    session = get_object_or_404(Session, id=session_id, status=Session.STATUS_COMPLETED)

    if profile.id not in (session.teacher_id, session.learner_id):
        return JsonResponse({'detail': 'Forbidden.'}, status=403)

    data = parse_json_body(request)
    if data is None:
        return json_bad_request('Invalid JSON payload.')

    try:
        rating = int(data.get('rating', 0))
    except (TypeError, ValueError):
        return json_bad_request('Rating must be an integer from 1 to 5.')

    comment = (data.get('comment') or '').strip()
    if rating < 1 or rating > 5:
        return json_bad_request('Rating must be between 1 and 5.')

    reviewee = session.learner if session.teacher_id == profile.id else session.teacher

    review, _ = Review.objects.update_or_create(
        session=session,
        reviewer=profile,
        defaults={
            'reviewee': reviewee,
            'rating': rating,
            'comment': comment,
        },
    )

    return JsonResponse(
        {
            'ok': True,
            'review': {
                'id': review.id,
                'rating': review.rating,
                'comment': review.comment,
                'reviewee_id': review.reviewee_id,
                'created_at': review.created_at.isoformat(),
            },
        }
    )
