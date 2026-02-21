from django.urls import path

from accounts.api_views import dashboard_api, login_api, logout_api, me_api, onboarding_api, signup_api

urlpatterns = [
    path('auth/signup/', signup_api, name='api_signup'),
    path('auth/login/', login_api, name='api_login'),
    path('auth/logout/', logout_api, name='api_logout'),
    path('me/', me_api, name='api_me'),
    path('onboarding/', onboarding_api, name='api_onboarding'),
    path('dashboard/', dashboard_api, name='api_dashboard'),
]
