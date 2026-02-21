from django.urls import path

from matching.api_views import matches_api, request_session_api

urlpatterns = [
    path('matches/', matches_api, name='api_matches'),
    path('matches/request/<int:profile_id>/', request_session_api, name='api_request_session'),
]
