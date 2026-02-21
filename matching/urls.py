from django.urls import path

from matching.views import matches_view, request_session

urlpatterns = [
    path('matches/', matches_view, name='matches'),
    path('matches/request/<int:profile_id>/', request_session, name='request_session'),
]
