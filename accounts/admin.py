from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from accounts.models import Profile

User = get_user_model()


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "full_name", "user", "level", "timezone", "created_at")
    search_fields = ("full_name", "user__username", "user__email", "languages")
    list_filter = ("level", "timezone", "created_at")
    readonly_fields = ("created_at",)


class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    extra = 0
    fk_name = "user"


try:
    admin.site.unregister(User)
except admin.sites.NotRegistered:
    pass


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    inlines = (ProfileInline,)
