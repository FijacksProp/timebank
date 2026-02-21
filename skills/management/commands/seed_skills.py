from django.core.management.base import BaseCommand

from skills.models import Skill


DEFAULT_SKILLS = [
    ('Python', 'Tech'),
    ('JavaScript', 'Tech'),
    ('UI Design', 'Design'),
    ('UX Research', 'Design'),
    ('Copywriting', 'Marketing'),
    ('SEO', 'Marketing'),
    ('English Speaking', 'Language'),
    ('French Speaking', 'Language'),
    ('Public Speaking', 'Communication'),
    ('Resume Writing', 'Career'),
    ('Interview Prep', 'Career'),
    ('Excel', 'Business'),
    ('Financial Modeling', 'Business'),
    ('Video Editing', 'Creative'),
    ('Photography', 'Creative'),
    ('Figma', 'Design'),
    ('React', 'Tech'),
    ('Django', 'Tech'),
    ('Product Management', 'Business'),
    ('Sales Basics', 'Business'),
    ('Music Production', 'Creative'),
    ('Data Analysis', 'Tech'),
    ('Prompt Engineering', 'Tech'),
    ('Brand Strategy', 'Marketing'),
    ('Presentation Design', 'Communication'),
]


class Command(BaseCommand):
    help = 'Seed a default catalog of skills'

    def handle(self, *args, **options):
        created = 0
        for name, category in DEFAULT_SKILLS:
            _, was_created = Skill.objects.get_or_create(name=name, defaults={'category': category})
            created += 1 if was_created else 0

        self.stdout.write(self.style.SUCCESS(f'Skill seed complete. New skills created: {created}'))
