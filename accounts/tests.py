from django.urls import reverse

from root.testutils import BaseAPITestCase


class AccountTests(BaseAPITestCase):
    def test_register_and_login_returns_role(self):
        r = self.client.post(reverse('register'), {
            'first_name': 'A', 'last_name': 'B', 'email': 'a@test.uz', 'role': 'employer',
            'password': self.password, 'conf_password': self.password,
        })
        self.assertEqual(r.status_code, 201)
        r = self.client.post(reverse('login'), {'email': 'a@test.uz', 'password': self.password})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['role'], 'employer')
        self.assertIn('access', r.data)

    def test_register_rejects_mismatched_passwords(self):
        r = self.client.post(reverse('register'), {
            'first_name': 'A', 'last_name': 'B', 'email': 'a@test.uz',
            'password': self.password, 'conf_password': 'other',
        })
        self.assertEqual(r.status_code, 400)

    def test_login_wrong_password(self):
        self.make_user('x@test.uz')
        r = self.client.post(reverse('login'), {'email': 'x@test.uz', 'password': 'nope'})
        self.assertEqual(r.status_code, 400)

    def test_me_requires_auth_and_reports_company(self):
        self.assertEqual(self.client.get(reverse('me')).status_code, 401)
        user, _ = self.make_employer()
        self.client.force_authenticate(user)
        data = self.client.get(reverse('me')).data
        self.assertEqual(data['role'], 'employer')
        self.assertTrue(data['has_company'])

    def test_preferences_ignore_unknown_keys_and_merge(self):
        user = self.make_candidate()
        self.client.force_authenticate(user)
        self.client.patch(reverse('preferences'), {'n_saved': True, 'is_staff': True}, format='json')
        r = self.client.patch(reverse('preferences'), {'alert_role': 'QA'}, format='json')
        self.assertEqual(r.data, {'n_saved': True, 'alert_role': 'QA'})
        user.refresh_from_db()
        self.assertFalse(user.is_staff)

    def test_delete_me_removes_account(self):
        user = self.make_candidate()
        self.client.force_authenticate(user)
        self.assertEqual(self.client.delete(reverse('me')).status_code, 204)
        user.__class__.objects.filter(pk=user.pk).exists() and self.fail('user still exists')
