from django.urls import path

from accounts.views import AppLoginView, AppLogoutView, dashboard, onboarding, signup_view

urlpatterns = [
    path('auth/signup/', signup_view, name='signup'),
    path('auth/login/', AppLoginView.as_view(), name='login'),
    path('auth/logout/', AppLogoutView.as_view(), name='logout'),
    path('onboarding/', onboarding, name='onboarding'),
    path('dashboard/', dashboard, name='dashboard'),
]
