from django.urls import reverse

from common.models import ContactMessage, Country, Post
from root.testutils import BaseAPITestCase


class LookupTests(BaseAPITestCase):
    def test_statistics_counts_active_jobs_and_new_jobs(self):
        _, co = self.make_employer()
        self.make_job(co)
        self.make_job(co, title='Old', status='draft')
        data = self.client.get(reverse('statistics')).data
        self.assertEqual(data['total_jobs'], 1)
        self.assertEqual(data['new_jobs'], 1)
        self.assertEqual(data['total_companies'], 1)

    def test_job_roles_include_active_job_counts(self):
        role = self.make_role('Design')
        _, co = self.make_employer()
        self.make_job(co, job_role=role)
        self.make_job(co, title='Draft', job_role=role, status='draft')
        rows = self.client.get(reverse('job-roles')).data
        self.assertEqual(rows, [{'id': role.id, 'name': 'Design', 'jobs_count': 1}])

    def test_countries_and_educations_are_unpaginated(self):
        Country.objects.create(name='Uzbekistan')
        self.make_education('PhD')
        self.assertIsInstance(self.client.get(reverse('countries')).data, list)
        self.assertEqual(self.client.get(reverse('educations')).data[0]['name'], 'PhD')


class BlogContactTests(BaseAPITestCase):
    def setUp(self):
        Post.objects.create(title='A', category='Career', body='x')
        Post.objects.create(title='B guide', category='Design', body='y')

    def test_blog_list_filters_and_detail(self):
        r = self.client.get(reverse('blog-list'), {'category': 'career'})
        self.assertEqual([p['title'] for p in r.data['results']], ['A'])
        r = self.client.get(reverse('blog-list'), {'search': 'guide'})
        self.assertEqual(r.data['count'], 1)
        pk = Post.objects.get(title='A').pk
        self.assertEqual(self.client.get(reverse('blog-detail', args=[pk])).data['body'], 'x')

    def test_blog_categories(self):
        names = {c['name']: c['count'] for c in self.client.get(reverse('blog-categories')).data}
        self.assertEqual(names, {'Career': 1, 'Design': 1})

    def test_contact_message_is_stored(self):
        r = self.client.post(reverse('contact'), {'name': 'N', 'email': 'n@test.uz', 'message': 'hi'})
        self.assertEqual(r.status_code, 201)
        self.assertEqual(ContactMessage.objects.count(), 1)

    def test_contact_requires_message(self):
        r = self.client.post(reverse('contact'), {'name': 'N', 'email': 'n@test.uz'})
        self.assertEqual(r.status_code, 400)
