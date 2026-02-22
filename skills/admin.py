from django.contrib import admin

from skills.models import ProfileSkillOffered, ProfileSkillWanted, Skill


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "category")
    search_fields = ("name", "category")
    list_filter = ("category",)


@admin.register(ProfileSkillOffered)
class ProfileSkillOfferedAdmin(admin.ModelAdmin):
    list_display = ("id", "profile", "skill", "level", "years")
    search_fields = ("profile__full_name", "skill__name")
    list_filter = ("level",)


@admin.register(ProfileSkillWanted)
class ProfileSkillWantedAdmin(admin.ModelAdmin):
    list_display = ("id", "profile", "skill", "target_level")
    search_fields = ("profile__full_name", "skill__name")
    list_filter = ("target_level",)
