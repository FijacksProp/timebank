from django.urls import path

from sessions_app.views import (
    accept_session,
    complete_session,
    decline_session,
    session_detail,
    sessions_list,
    submit_review,
)

urlpatterns = [
    path('sessions/', sessions_list, name='sessions_list'),
    path('sessions/<int:session_id>/', session_detail, name='session_detail'),
    path('sessions/<int:session_id>/accept/', accept_session, name='accept_session'),
    path('sessions/<int:session_id>/decline/', decline_session, name='decline_session'),
    path('sessions/<int:session_id>/complete/', complete_session, name='complete_session'),
    path('sessions/<int:session_id>/review/', submit_review, name='submit_review'),
]
