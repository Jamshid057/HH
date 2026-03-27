from django.db import models
from django.conf import settings

from common.models import Country


class Company(models.Model):
    class OrganizationType(models.TextChoices):
        STARTUP = 'startup', 'Startup'
        PUBLIC = 'public', 'Public'
        PRIVATE = 'private', 'Private'
        NGO = 'ngo', 'NGO'

    class TeamSize(models.TextChoices):
        ONE_TEN = '1-10', '1-10'
        TEN_FIFTY = '10-50', '10-50'
        FIFTY_HUNDRED = '50-100', '50-100'
        HUNDRED_TWO = '100-200', '100-200'
        TWO_PLUS = '200+', '200+'

    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='company'
    )
    name = models.CharField(max_length=200)
    logo = models.ImageField(upload_to='companies/logos/', blank=True)
    banner_image = models.ImageField(upload_to='companies/banners/', blank=True)
    description = models.TextField(blank=True)
    country = models.ForeignKey(Country, on_delete=models.SET_NULL, null=True, blank=True)
    organization_type = models.CharField(
        max_length=20, choices=OrganizationType.choices, blank=True
    )
    team_size = models.CharField(max_length=20, choices=TeamSize.choices, blank=True)
    establishment_year = models.IntegerField(null=True, blank=True)
    company_web = models.URLField(blank=True)
    vision = models.TextField(blank=True)
    location = models.CharField(max_length=200, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)

    class Meta:
        db_table = 'company'
        verbose_name = 'company'
        verbose_name_plural = 'companies'

    def __str__(self):
        return self.name


class SavedCandidate(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='saved_candidates')
    candidate = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='saved_by_companies'
    )
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'saved_candidate'
        verbose_name = 'saved candidate'
        verbose_name_plural = 'saved candidates'
        unique_together = ('company', 'candidate')

    def __str__(self):
        return f'{self.company.name} → {self.candidate.full_name}'
