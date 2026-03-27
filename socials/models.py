from django.db import models
from django.conf import settings


class Social(models.Model):
    name = models.CharField(max_length=100)
    logo = models.ImageField(upload_to='socials/')

    class Meta:
        db_table = 'social'
        verbose_name = 'social'
        verbose_name_plural = 'socials'

    def __str__(self):
        return self.name


class SocialLink(models.Model):
    social = models.ForeignKey(Social, on_delete=models.CASCADE, related_name='links')
    url = models.URLField()
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='social_links'
    )
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='social_links'
    )

    class Meta:
        db_table = 'social_link'
        verbose_name = 'social link'
        verbose_name_plural = 'social links'

    def __str__(self):
        return f'{self.social.name} — {self.url}'
