from django.db import models


class Skill(models.Model):
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=80, blank=True)

    def __str__(self):
        return self.name


class ProfileSkillOffered(models.Model):
    LEVEL_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]

    profile = models.ForeignKey('accounts.Profile', on_delete=models.CASCADE, related_name='offered_skills')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='beginner')
    years = models.PositiveSmallIntegerField(default=0)

    class Meta:
        unique_together = ('profile', 'skill')


class ProfileSkillWanted(models.Model):
    LEVEL_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]

    profile = models.ForeignKey('accounts.Profile', on_delete=models.CASCADE, related_name='wanted_skills')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    target_level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='beginner')

    class Meta:
        unique_together = ('profile', 'skill')
