from django.db import models


class Review(models.Model):
    session = models.ForeignKey('sessions_app.Session', on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey('accounts.Profile', on_delete=models.CASCADE, related_name='reviews_written')
    reviewee = models.ForeignKey('accounts.Profile', on_delete=models.CASCADE, related_name='reviews_received')
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['session', 'reviewer'], name='unique_review_per_reviewer_per_session')
        ]

    def __str__(self):
        return f'{self.rating}/5 by {self.reviewer}'
