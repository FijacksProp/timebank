from django.urls import path

from sessions_app.api_views import (
    accept_session_api,
    complete_session_api,
    confirm_complete_session_api,
    decline_session_api,
    send_session_chat_api,
    session_detail_api,
    session_chat_api,
    sessions_list_api,
    submit_review_api,
)

urlpatterns = [
    path('sessions/', sessions_list_api, name='api_sessions_list'),
    path('sessions/<int:session_id>/', session_detail_api, name='api_session_detail'),
    path('sessions/<int:session_id>/accept/', accept_session_api, name='api_accept_session'),
    path('sessions/<int:session_id>/decline/', decline_session_api, name='api_decline_session'),
    path('sessions/<int:session_id>/complete/', complete_session_api, name='api_complete_session'),
    path('sessions/<int:session_id>/confirm-complete/', confirm_complete_session_api, name='api_confirm_complete_session'),
    path('sessions/<int:session_id>/review/', submit_review_api, name='api_submit_review'),
    path('sessions/<int:session_id>/chat/', session_chat_api, name='api_session_chat'),
    path('sessions/<int:session_id>/chat/send/', send_session_chat_api, name='api_send_session_chat'),
]
