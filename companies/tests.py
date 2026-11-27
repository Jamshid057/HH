from django.urls import reverse

from candidates.models import Apply
from companies.models import Company, SavedCandidate
from root.testutils import BaseAPITestCase


class CompanyTests(BaseAPITestCase):
    def setUp(self):
        self.owner, self.co = self.make_employer()
        self.job = self.make_job(self.co)
        self.cand = self.make_candidate()
        self.apply = Apply.objects.create(user=self.cand, job=self.job, letter='hello')

    def test_register_company_once(self):
        user = self.make_user('new@test.uz', 'employer')
        self.client.force_authenticate(user)
        self.assertEqual(self.client.post(reverse('company-register'), {'name': 'NewCo'}).status_code, 201)
        self.assertEqual(self.client.post(reverse('company-register'), {'name': 'Again'}).status_code, 409)
        self.assertTrue(Company.objects.filter(owner=user, name='NewCo').exists())

    def test_public_list_and_detail(self):
        self.assertEqual(self.client.get(reverse('company-list')).data['count'], 1)
        self.assertEqual(self.client.get(reverse('company-public-detail', args=[self.co.pk])).data['name'], 'Acme')

    def test_applications_list_is_owner_only(self):
        url = reverse('job-applications', args=[self.job.pk])
        self.client.force_authenticate(self.cand)
        self.assertEqual(self.client.get(url).status_code, 403)
        stranger, _ = self.make_employer('s@test.uz', 'Stranger')
        self.client.force_authenticate(stranger)
        self.assertEqual(self.client.get(url).data['count'], 0)
        self.client.force_authenticate(self.owner)
        row = self.client.get(url).data['results'][0]
        self.assertEqual((row['fullname'], row['status'], row['letter']), ('Test Candidate', 'pending', 'hello'))
        self.assertEqual(row['user_id'], self.cand.pk)

    def test_update_application_status(self):
        url = reverse('job-application-status', args=[self.job.pk, self.apply.pk])
        self.client.force_authenticate(self.owner)
        self.assertEqual(self.client.patch(url, {'status': 'accepted'}).status_code, 200)
        self.apply.refresh_from_db()
        self.assertEqual(self.apply.status, 'accepted')
        self.assertEqual(self.client.patch(url, {'status': 'nope'}).status_code, 400)
        stranger, _ = self.make_employer('s@test.uz', 'Stranger')
        self.client.force_authenticate(stranger)
        self.assertEqual(self.client.patch(url, {'status': 'rejected'}).status_code, 404)

    def test_saved_candidate_toggle_uses_user_id(self):
        self.client.force_authenticate(self.owner)
        self.assertEqual(self.client.post(reverse('saved-candidate-toggle', args=[self.cand.pk])).status_code, 201)
        saved = self.client.get(reverse('saved-candidates')).data['results']
        self.assertEqual(saved[0]['candidate_id'], self.cand.pk)
        self.assertEqual(self.client.post(reverse('saved-candidate-toggle', args=[self.cand.pk])).status_code, 200)
        self.assertEqual(SavedCandidate.objects.count(), 0)

    def test_company_jobs_and_dashboard(self):
        self.client.force_authenticate(self.owner)
        rows = self.client.get(reverse('company-jobs')).data['results']
        self.assertEqual((rows[0]['apply_count'], rows[0]['promote_type']), (1, ''))
        self.assertEqual(self.client.get(reverse('company-dashboard')).data['active_job_count'], 1)
