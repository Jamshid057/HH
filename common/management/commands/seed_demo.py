import base64
import random
from datetime import timedelta

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import CustomUser
from candidates.models import CandidateProfile
from common.models import Country, Education, JobRole, Post
from companies.models import Company
from jobs.models import Job
from socials.models import Social

PNG = base64.b64decode(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
)

ROLES = ['Graphics & Design', 'Code & Programming', 'Digital Marketing', 'Video & Animation', 'Music & Audio',
         'Account & Finance', 'Health & Care', 'Data & Science']
EDU = ['High School', "Bachelor's Degree", "Master's Degree", 'PhD']
COUNTRIES = ['Uzbekistan', 'Kazakhstan', 'Turkey', 'Germany', 'United States']
SOCIALS = ['Facebook', 'Twitter', 'Instagram', 'LinkedIn', 'Telegram', 'YouTube']
COMPANIES = ['Dribbble', 'Upwork', 'Slack', 'Freepik', 'Figma', 'Notion', 'Uzum', 'Click']
TITLES = ['Senior UX Designer', 'Frontend Developer', 'Backend Engineer (Django)', 'Marketing Manager', 'Product Designer',
          'Data Analyst', 'QA Engineer', 'Technical Support', 'Motion Designer', 'Accountant', 'DevOps Engineer',
          'Content Writer']


class Command(BaseCommand):
    help = 'Fill the database with demo data (employer@demo.uz / candidate@demo.uz, password: Demo12345!)'

    def handle(self, *args, **opts):
        roles = [JobRole.objects.get_or_create(name=n)[0] for n in ROLES]
        edus = [Education.objects.get_or_create(name=n)[0] for n in EDU]
        countries = [Country.objects.get_or_create(name=n)[0] for n in COUNTRIES]
        for n in SOCIALS:
            if not Social.objects.filter(name=n).exists():
                Social(name=n).logo.save(f'{n.lower()}.png', ContentFile(PNG), save=True)

        companies = []
        for i, name in enumerate(COMPANIES):
            email = 'employer@demo.uz' if i == 0 else f'hr{i}@demo.uz'
            user, created = CustomUser.objects.get_or_create(
                email=email, defaults=dict(first_name=name, last_name='HR', role='employer', email_verified=True))
            if created:
                user.set_password('Demo12345!')
                user.save()
            company, _ = Company.objects.get_or_create(owner=user, defaults=dict(
                name=name, description=f'{name} builds products used by millions of people.',
                country=random.choice(countries), organization_type=random.choice(['startup', 'private', 'public']),
                team_size=random.choice(['1-10', '10-50', '50-100', '100-200']), establishment_year=random.randint(2005, 2022),
                location='Tashkent', email=email, phone_number='+998901234567', company_web='https://example.com',
                vision='Make hiring simple and human.'))
            companies.append(company)

        if not Job.objects.exists():
            for i, title in enumerate(TITLES * 2):
                lo = random.choice([500, 800, 1200, 2000])
                Job.objects.create(
                    company=companies[i % len(companies)], title=title, job_role=roles[i % len(roles)],
                    min_salary=lo, max_salary=lo + random.choice([500, 1000, 1500]),
                    education=random.choice(edus), experience=random.choice(['0-1', '1-2', '2-3', '3-5', '5+']),
                    type=random.choice(['fulltime', 'parttime', 'remote', 'freelance', 'internship']),
                    vacancy=random.randint(1, 5), expiration_date=timezone.now().date() + timedelta(days=30),
                    level=random.choice(['entry', 'mid', 'senior']), description='We are looking for a motivated '
                    f'{title} to join our team.\n\nYou will work with a friendly, cross-functional group.',
                    responsibilities='- Ship great work\n- Collaborate with the team\n- Improve our processes',
                    tags='remote, team, growth', promote_type=random.choice(['featured', 'featured', 'urgent', '']))

        if not Post.objects.exists():
            for i, (t, c) in enumerate([('20 cool fonts for web and graphic design', 'Design'), ('How to write a CV that gets interviews', 'Career'),
                                        ('Remote work: pros and cons', 'Lifestyle'), ('Salary negotiation 101', 'Career'),
                                        ('Hiring in 2026: what employers want', 'Business'), ('Portfolio tips for junior developers', 'Programming')]):
                Post.objects.create(title=t, category=c, author='MyJob Team', excerpt='Short practical guide with examples and tips.',
                                    body='Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent non sem facilisis, hendrerit nisi vitae, volutpat quam.\n\n' * 4)

        for i in range(6):
            email = 'candidate@demo.uz' if i == 0 else f'cand{i}@demo.uz'
            user, created = CustomUser.objects.get_or_create(
                email=email, defaults=dict(first_name=random.choice(['Aziz', 'Dilnoza', 'Sardor', 'Madina']),
                                           last_name=random.choice(['Karimov', 'Aliyeva', 'Tursunov']),
                                           role='candidate', email_verified=True))
            if created:
                user.set_password('Demo12345!')
                user.save()
            profile, _ = CandidateProfile.objects.get_or_create(user=user, defaults=dict(
                title_headline=random.choice(['Frontend Developer', 'UI/UX Designer', 'Data Analyst']),
                experience=random.choice(['0-1', '1-2', '2-3', '3-5']), location='Tashkent',
                biography='Passionate professional looking for new challenges.', phone_number='+998909876543'))
            profile.educations.add(random.choice(edus))
        self.stdout.write(self.style.SUCCESS('Demo data ready. employer@demo.uz / candidate@demo.uz — Demo12345!'))
