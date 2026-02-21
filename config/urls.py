from django.contrib import admin
from django.urls import include, path

from accounts.views import landing

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', landing, name='landing'),
    path('', include('accounts.urls')),
    path('', include('matching.urls')),
    path('', include('sessions_app.urls')),
]
