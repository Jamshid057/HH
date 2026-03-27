from django.db import models


class Country(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        db_table = 'country'
        verbose_name = 'country'
        verbose_name_plural = 'countries'

    def __str__(self):
        return self.name


class Education(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        db_table = 'education'
        verbose_name = 'education'
        verbose_name_plural = 'educations'

    def __str__(self):
        return self.name


class JobRole(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        db_table = 'job_role'
        verbose_name = 'job role'
        verbose_name_plural = 'job roles'

    def __str__(self):
        return self.name
