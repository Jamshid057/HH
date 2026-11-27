from datetime import timedelta

from django.utils import timezone
from rest_framework.test import APITestCase

from accounts.models import CustomUser
from candidates.models import CandidateProfile
from common.models import Education, JobRole
from companies.models import Company
from jobs.models import Job


class BaseAPITestCase(APITestCase):
    """Small factories shared by the API tests."""

    password = 'Str0ng-pass!'

    def make_user(self, email, role='candidate', **extra):
        return CustomUser.objects.create_user(
            email=email, password=self.password, first_name='Test', last_name=role.title(), role=role, **extra
        )

    def make_candidate(self, email='cand@test.uz'):
        user = self.make_user(email, 'candidate')
        CandidateProfile.objects.create(user=user, title_headline='Dev', experience='1-2')
        return user

    def make_employer(self, email='emp@test.uz', name='Acme', **company):
        user = self.make_user(email, 'employer')
        co = Company.objects.create(owner=user, name=name, location='Tashkent', **company)
        return user, co

    def make_job(self, company, title='Python Developer', **extra):
        defaults = dict(
            min_salary=1000, max_salary=2000, type='fulltime', description='desc',
            expiration_date=timezone.now().date() + timedelta(days=30),
        )
        defaults.update(extra)
        return Job.objects.create(company=company, title=title, **defaults)

    def make_role(self, name='Design'):
        return JobRole.objects.create(name=name)

    def make_education(self, name='Bachelor'):
        return Education.objects.create(name=name)
