from django.contrib import admin

from sessions_app.models import CreditLedger, Session, SessionMessage


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "teacher",
        "learner",
        "skill",
        "status",
        "scheduled_at",
        "duration_min",
        "created_at",
    )
    search_fields = ("teacher__full_name", "learner__full_name", "skill__name", "meeting_link")
    list_filter = ("status", "scheduled_at", "created_at")
    readonly_fields = ("created_at",)


@admin.register(CreditLedger)
class CreditLedgerAdmin(admin.ModelAdmin):
    list_display = ("id", "profile", "delta", "reason", "session", "created_at")
    search_fields = ("profile__full_name", "reason")
    list_filter = ("reason", "created_at")
    readonly_fields = ("created_at",)


@admin.register(SessionMessage)
class SessionMessageAdmin(admin.ModelAdmin):
    list_display = ("id", "session", "sender", "created_at")
    search_fields = ("sender__full_name", "message")
    list_filter = ("created_at",)
    readonly_fields = ("created_at",)
