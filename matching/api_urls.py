from django.urls import path

from matching.api_views import dashboard_api, matches_api, request_session_api

urlpatterns = [
    path('dashboard/', dashboard_api, name='api_dashboard'),
    path('matches/', matches_api, name='api_matches'),
    path('matches/request/<int:profile_id>/', request_session_api, name='api_request_session'),
]
