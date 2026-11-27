from django.core.files.base import ContentFile
from django.urls import reverse

from root.testutils import BaseAPITestCase
from socials.models import Social, SocialLink


class SocialTests(BaseAPITestCase):
    def setUp(self):
        self.social = Social(name='Facebook')
        self.social.logo.save('fb.png', ContentFile(b'x'), save=True)
        self.user = self.make_candidate()
        self.client.force_authenticate(self.user)

    def test_platforms_are_public(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(reverse('social-platforms')).data[0]['name'], 'Facebook')

    def test_add_list_and_delete_own_links(self):
        r = self.client.post(reverse('social-link-list-create'), {'social': self.social.pk, 'url': 'https://fb.com/me'})
        self.assertEqual(r.status_code, 201)
        self.assertEqual(len(self.client.get(reverse('social-link-list-create')).data), 1)
        pk = r.data['id']
        self.assertEqual(self.client.delete(reverse('social-link-detail', args=[pk])).status_code, 204)

    def test_cannot_touch_someone_elses_link(self):
        other = self.make_candidate('o@test.uz')
        link = SocialLink.objects.create(social=self.social, url='https://x.uz', user=other)
        self.assertEqual(self.client.delete(reverse('social-link-detail', args=[link.pk])).status_code, 404)
