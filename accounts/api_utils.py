from functools import wraps
import json

from django.http import JsonResponse


def api_login_required(view_func):
    @wraps(view_func)
    def wrapped(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({'detail': 'Authentication required.'}, status=401)
        return view_func(request, *args, **kwargs)

    return wrapped


def parse_json_body(request):
    if not request.body:
        return {}
    try:
        return json.loads(request.body)
    except json.JSONDecodeError:
        return None


def json_bad_request(message):
    return JsonResponse({'detail': message}, status=400)
