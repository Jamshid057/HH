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


class Post(models.Model):
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=100, blank=True)
    image = models.ImageField(upload_to='blog/', blank=True)
    excerpt = models.CharField(max_length=300, blank=True)
    body = models.TextField()
    author = models.CharField(max_length=100, default='Admin')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'blog_post'
        ordering = ('-created_at',)

    def __str__(self):
        return self.title


class ContactMessage(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    subject = models.CharField(max_length=200, blank=True)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'contact_message'
        ordering = ('-created_at',)

    def __str__(self):
        return f'{self.name}: {self.subject}'
