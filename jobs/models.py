from django.db import models
from django.conf import settings

from common.models import Education, JobRole


class Job(models.Model):
    class SalaryType(models.TextChoices):
        MONTHLY = 'monthly', 'Monthly'
        HOURLY = 'hourly', 'Hourly'
        YEARLY = 'yearly', 'Yearly'

    class Experience(models.TextChoices):
        ZERO_ONE = '0-1', '0-1 yil'
        ONE_TWO = '1-2', '1-2 yil'
        TWO_THREE = '2-3', '2-3 yil'
        THREE_FIVE = '3-5', '3-5 yil'
        FIVE_PLUS = '5+', '5+ yil'

    class JobType(models.TextChoices):
        FULLTIME = 'fulltime', 'Full Time'
        PARTTIME = 'parttime', 'Part Time'
        REMOTE = 'remote', 'Remote'
        FREELANCE = 'freelance', 'Freelance'
        INTERNSHIP = 'internship', 'Internship'

    class Level(models.TextChoices):
        ENTRY = 'entry', 'Entry Level'
        MID = 'mid', 'Mid Level'
        SENIOR = 'senior', 'Senior Level'
        DIRECTOR = 'director', 'Director'
        VP = 'vp', 'VP or Above'

    class ApplyType(models.TextChoices):
        ONLINE = 'online', 'Online'
        EMAIL = 'email', 'Via Email'
        EXTERNAL = 'external', 'External'

    class PromoteType(models.TextChoices):
        FEATURED = 'featured', 'Featured'
        URGENT = 'urgent', 'Urgent'
        POPULAR = 'popular', 'Popular'

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        DRAFT = 'draft', 'Draft'
        EXPIRED = 'expired', 'Expired'

    company = models.ForeignKey(
        'companies.Company', on_delete=models.CASCADE, related_name='jobs'
    )
    title = models.CharField(max_length=200)
    job_role = models.ForeignKey(
        JobRole, on_delete=models.SET_NULL, null=True, blank=True
    )
    min_salary = models.DecimalField(max_digits=10, decimal_places=2)
    max_salary = models.DecimalField(max_digits=10, decimal_places=2)
    salary_type = models.CharField(
        max_length=20, choices=SalaryType.choices, default=SalaryType.MONTHLY
    )
    education = models.ForeignKey(
        Education, on_delete=models.SET_NULL, null=True, blank=True
    )
    experience = models.CharField(max_length=10, choices=Experience.choices, blank=True)
    type = models.CharField(max_length=20, choices=JobType.choices)
    vacancy = models.IntegerField(default=1)
    expiration_date = models.DateField()
    level = models.CharField(max_length=20, choices=Level.choices, blank=True)
    apply_type = models.CharField(
        max_length=20, choices=ApplyType.choices, default=ApplyType.ONLINE
    )
    description = models.TextField()
    responsibilities = models.TextField(blank=True)
    tags = models.CharField(max_length=500, blank=True)
    promote_type = models.CharField(max_length=20, choices=PromoteType.choices, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'job'
        verbose_name = 'job'
        verbose_name_plural = 'jobs'

    def __str__(self):
        return f'{self.title} — {self.company.name}'


class JobAlert(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='job_alerts'
    )
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='alerts')
    alerted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'job_alert'
        verbose_name = 'job alert'
        verbose_name_plural = 'job alerts'
        unique_together = ('user', 'job')

    def __str__(self):
        return f'{self.user.full_name} → {self.job.title}'
