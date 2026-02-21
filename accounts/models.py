from django.conf import settings
from django.db import models


class Profile(models.Model):
    LEVEL_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=120)
    bio = models.TextField(blank=True)
    timezone = models.CharField(max_length=64, default='UTC')
    languages = models.CharField(max_length=255, blank=True, help_text='Comma-separated languages')
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='beginner')
    avatar_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def language_set(self):
        return {item.strip().lower() for item in self.languages.split(',') if item.strip()}

    def __str__(self):
        return self.full_name or self.user.username
