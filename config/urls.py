from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def root_health(_request):
    return JsonResponse({'service': 'timebank-api', 'status': 'ok'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', root_health, name='root_health'),
    path('api/', include('accounts.api_urls')),
    path('api/', include('matching.api_urls')),
    path('api/', include('sessions_app.api_urls')),
]
