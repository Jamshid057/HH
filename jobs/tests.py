from django.urls import reverse

from jobs.models import Job, JobAlert
from root.testutils import BaseAPITestCase


class JobListTests(BaseAPITestCase):
    def setUp(self):
        self.role = self.make_role()
        _, self.co = self.make_employer()
        _, self.other = self.make_employer('o@test.uz', 'Other')
        self.make_job(self.co, 'Python Developer', job_role=self.role, type='remote')
        self.make_job(self.other, 'Designer', type='parttime')
        self.make_job(self.co, 'Hidden', status='draft')

    def titles(self, **params):
        return sorted(j['title'] for j in self.client.get(reverse('job-list'), params).data['results'])

    def test_only_active_jobs_are_listed(self):
        self.assertEqual(self.titles(), ['Designer', 'Python Developer'])

    def test_filters(self):
        self.assertEqual(self.titles(title='pyth'), ['Python Developer'])
        self.assertEqual(self.titles(type='parttime'), ['Designer'])
        self.assertEqual(self.titles(job_role_id=self.role.id), ['Python Developer'])
        self.assertEqual(self.titles(company_id=self.other.id), ['Designer'])

    def test_page_size_param(self):
        r = self.client.get(reverse('job-list'), {'page_size': 1})
        self.assertEqual((r.data['count'], len(r.data['results'])), (2, 1))


class JobWriteTests(BaseAPITestCase):
    payload = {'title': 'QA', 'min_salary': 500, 'max_salary': 900, 'type': 'fulltime',
               'expiration_date': '2030-01-01', 'description': 'd'}

    def test_create_requires_company(self):
        self.client.force_authenticate(self.make_candidate())
        self.assertEqual(self.client.post(reverse('job-create'), self.payload).status_code, 403)

    def test_create_job_as_employer(self):
        user, co = self.make_employer()
        self.client.force_authenticate(user)
        r = self.client.post(reverse('job-create'), self.payload)
        self.assertEqual(r.status_code, 201)
        self.assertEqual(Job.objects.get(pk=r.data['id']).company, co)

    def test_manage_only_by_owner(self):
        owner, co = self.make_employer()
        job = self.make_job(co)
        other, _ = self.make_employer('o@test.uz', 'Other')
        url = reverse('job-manage', args=[job.pk])
        self.client.force_authenticate(other)
        self.assertEqual(self.client.patch(url, {'status': 'expired'}).status_code, 404)
        self.client.force_authenticate(owner)
        r = self.client.patch(url, {'status': 'expired', 'promote_type': 'featured'})
        self.assertEqual(r.status_code, 200)
        job.refresh_from_db()
        self.assertEqual((job.status, job.promote_type), ('expired', 'featured'))

    def test_manage_rejects_invalid_status(self):
        owner, co = self.make_employer()
        job = self.make_job(co)
        self.client.force_authenticate(owner)
        self.assertEqual(self.client.patch(reverse('job-manage', args=[job.pk]), {'status': 'bogus'}).status_code, 400)


class JobDetailAlertTests(BaseAPITestCase):
    def test_detail_is_saved_flag_and_alert_toggle(self):
        _, co = self.make_employer()
        job = self.make_job(co)
        cand = self.make_candidate()
        self.client.force_authenticate(cand)
        self.client.post(reverse('wishlist-toggle', args=[job.pk]))
        self.assertTrue(self.client.get(reverse('job-detail', args=[job.pk])).data['is_saved'])
        self.assertEqual(self.client.post(reverse('job-alert-toggle', args=[job.pk])).status_code, 201)
        self.assertEqual(JobAlert.objects.count(), 1)
        self.assertEqual(self.client.post(reverse('job-alert-toggle', args=[job.pk])).status_code, 200)
        self.assertEqual(JobAlert.objects.count(), 0)

    def test_anonymous_detail_not_saved(self):
        _, co = self.make_employer()
        job = self.make_job(co)
        self.assertFalse(self.client.get(reverse('job-detail', args=[job.pk])).data['is_saved'])
