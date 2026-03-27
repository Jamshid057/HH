from django.db import models
from django.conf import settings

from common.models import Country, Education


class CandidateProfile(models.Model):
    class Experience(models.TextChoices):
        ZERO_ONE = '0-1', '0-1 yil'
        ONE_TWO = '1-2', '1-2 yil'
        TWO_THREE = '2-3', '2-3 yil'
        THREE_FIVE = '3-5', '3-5 yil'
        FIVE_PLUS = '5+', '5+ yil'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='candidate_profile'
    )
    title_headline = models.CharField(max_length=200, blank=True)
    experience = models.CharField(max_length=10, choices=Experience.choices, blank=True)
    personal_web = models.URLField(blank=True)
    profile_photo = models.ImageField(upload_to='candidates/photos/', blank=True)
    nationality = models.ForeignKey(
        Country, on_delete=models.SET_NULL, null=True, blank=True
    )
    biography = models.TextField(blank=True)
    location = models.CharField(max_length=200, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    educations = models.ManyToManyField(Education, blank=True)

    class Meta:
        db_table = 'candidate_profile'
        verbose_name = 'candidate profile'
        verbose_name_plural = 'candidate profiles'

    def __str__(self):
        return f'{self.user.full_name} — {self.title_headline}'


class Resume(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='resumes'
    )
    name = models.CharField(max_length=200)
    file = models.FileField(upload_to='candidates/resumes/')

    class Meta:
        db_table = 'resume'
        verbose_name = 'resume'
        verbose_name_plural = 'resumes'

    def __str__(self):
        return f'{self.name} — {self.user.full_name}'


class Apply(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        REVIEWED = 'reviewed', 'Reviewed'
        ACCEPTED = 'accepted', 'Accepted'
        REJECTED = 'rejected', 'Rejected'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='applications'
    )
    job = models.ForeignKey('jobs.Job', on_delete=models.CASCADE, related_name='applications')
    cv = models.ForeignKey(Resume, on_delete=models.SET_NULL, null=True)
    letter = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    applied_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'apply'
        verbose_name = 'application'
        verbose_name_plural = 'applications'
        unique_together = ('user', 'job')

    def __str__(self):
        return f'{self.user.full_name} → {self.job.title}'


class CandidateWishlist(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='wishlist'
    )
    job = models.ForeignKey('jobs.Job', on_delete=models.CASCADE, related_name='wishlisted_by')
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'candidate_wishlist'
        verbose_name = 'candidate wishlist'
        verbose_name_plural = 'candidate wishlists'
        unique_together = ('user', 'job')

    def __str__(self):
        return f'{self.user.full_name} → {self.job.title}'
