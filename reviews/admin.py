from django.contrib import admin

from reviews.models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("id", "session", "reviewer", "reviewee", "rating", "created_at")
    search_fields = ("reviewer__full_name", "reviewee__full_name", "comment")
    list_filter = ("rating", "created_at")
    readonly_fields = ("created_at",)
