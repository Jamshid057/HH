from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse

from candidates.models import Apply, CandidateProfile, Resume
from root.testutils import BaseAPITestCase


@override_settings(MEDIA_ROOT='/tmp/hh_test_media')
class CandidateTests(BaseAPITestCase):
    def setUp(self):
        self.user = self.make_candidate()
        self.client.force_authenticate(self.user)
        _, self.co = self.make_employer()
        self.job = self.make_job(self.co)

    def upload_cv(self, name='CV'):
        f = SimpleUploadedFile('cv.pdf', b'%PDF-1.4', content_type='application/pdf')
        return self.client.post(reverse('resumes'), {'name': name, 'file': f}, format='multipart')

    def test_resume_crud_is_scoped_to_owner(self):
        self.assertEqual(self.upload_cv().status_code, 201)
        other = self.make_candidate('other@test.uz')
        Resume.objects.create(user=other, name='Theirs', file='x.pdf')
        names = [r['name'] for r in self.client.get(reverse('resumes')).data]
        self.assertEqual(names, ['CV'])
        theirs = Resume.objects.get(name='Theirs')
        self.assertEqual(self.client.delete(reverse('resume-delete', args=[theirs.pk])).status_code, 404)

    def test_employer_cannot_use_candidate_endpoints(self):
        emp, _ = self.make_employer('e2@test.uz', 'E2')
        self.client.force_authenticate(emp)
        self.assertEqual(self.client.get(reverse('resumes')).status_code, 403)

    def test_apply_once_and_list_applied(self):
        cv = self.upload_cv().data['id']
        r = self.client.post(reverse('candidate-apply'), {'job': self.job.pk, 'cv': cv, 'letter': 'hi'})
        self.assertEqual(r.status_code, 201)
        again = self.client.post(reverse('candidate-apply'), {'job': self.job.pk, 'cv': cv})
        self.assertEqual(again.status_code, 400)
        rows = self.client.get(reverse('applied-jobs')).data['results']
        self.assertEqual([(a['title'], a['status']) for a in rows], [('Python Developer', 'pending')])

    def test_wishlist_toggle_and_dashboard_counts(self):
        self.assertEqual(self.client.post(reverse('wishlist-toggle', args=[self.job.pk])).status_code, 201)
        self.assertEqual(self.client.get(reverse('candidate-dashboard')).data['wishlist_count'], 1)
        self.assertEqual(self.client.post(reverse('wishlist-toggle', args=[self.job.pk])).status_code, 200)
        self.assertEqual(self.client.get(reverse('wishlist-toggle', args=[self.job.pk])).status_code, 405)

    def test_patch_profile_creates_missing_profile(self):
        fresh = self.make_user('fresh@test.uz')
        self.client.force_authenticate(fresh)
        self.assertEqual(self.client.get(reverse('candidate-profile')).status_code, 404)
        r = self.client.patch(reverse('candidate-profile'), {'title_headline': 'QA', 'location': 'Tashkent'}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(CandidateProfile.objects.get(user=fresh).title_headline, 'QA')

    def test_browse_is_employer_only_and_exposes_user_id(self):
        self.assertEqual(self.client.get(reverse('browse-candidates')).status_code, 403)
        emp, _ = self.make_employer('e3@test.uz', 'E3')
        self.client.force_authenticate(emp)
        rows = self.client.get(reverse('browse-candidates')).data['results']
        self.assertEqual(rows[0]['user_id'], self.user.pk)

    def test_change_password(self):
        r = self.client.patch(reverse('change-password'), {
            'current_password': self.password, 'new_password': 'N3w-secret-pass', 'confirm_password': 'N3w-secret-pass'})
        self.assertEqual(r.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('N3w-secret-pass'))
