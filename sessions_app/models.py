from django.db import models


class Session(models.Model):
    STATUS_REQUESTED = 'requested'
    STATUS_ACCEPTED = 'accepted'
    STATUS_DECLINED = 'declined'
    STATUS_COMPLETED = 'completed'
    STATUS_CANCELLED = 'cancelled'

    STATUS_CHOICES = [
        (STATUS_REQUESTED, 'Requested'),
        (STATUS_ACCEPTED, 'Accepted'),
        (STATUS_DECLINED, 'Declined'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    teacher = models.ForeignKey('accounts.Profile', on_delete=models.CASCADE, related_name='sessions_as_teacher')
    learner = models.ForeignKey('accounts.Profile', on_delete=models.CASCADE, related_name='sessions_as_learner')
    skill = models.ForeignKey('skills.Skill', on_delete=models.CASCADE)
    scheduled_at = models.DateTimeField(null=True, blank=True)
    duration_min = models.PositiveSmallIntegerField(default=60)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_REQUESTED)
    meeting_link = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.learner} learning {self.skill} from {self.teacher}'


class CreditLedger(models.Model):
    REASON_SIGNUP = 'signup_bonus'
    REASON_TEACHING = 'teaching_reward'
    REASON_LEARNING = 'learning_spend'

    profile = models.ForeignKey('accounts.Profile', on_delete=models.CASCADE, related_name='credit_entries')
    delta = models.SmallIntegerField()
    reason = models.CharField(max_length=50)
    session = models.ForeignKey(Session, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
